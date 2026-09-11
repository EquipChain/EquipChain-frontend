"use client";

import { ExportButton } from "@/src/components/export/ExportButton";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { DataTable, type DataTableColumn } from "@/src/components/ui/DataTable";
import { StatusBadge } from "@/src/components/ui/Badge";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { Button } from "@/src/components/ui/Button";
import { useToast } from "@/src/components/ui/toast";
import { Copy, MapPin } from "lucide-react";
import { useMeters } from "@/src/lib/api/hooks";
import { meterUnit } from "@/src/lib/fixtures/demo";
import {
  formatConsumption,
  formatCurrency,
  formatRelativeTime,
  formatStellarAddress,
} from "@/src/lib/utils/format";
import type { Meter } from "@/src/lib/types/domain";

// ============================================================================
// Meters page — typed table over the SWR data layer
// ============================================================================
// Previously this page inlined literal rows with pre-formatted strings, so
// sorting compared strings ("9,000" vs "10,000" sorted wrong), the export
// re-exported the same display strings, and no loading/error state existed.
// It now consumes useMeters() and formats at the presentation edge.

const METER_COLUMNS = [
  { key: "id", label: "Meter ID", enabled: true },
  { key: "name", label: "Name", enabled: true },
  { key: "type", label: "Type", enabled: true },
  { key: "status", label: "Status", enabled: true },
  { key: "lastReading", label: "Last Reading", enabled: true },
  { key: "totalConsumption", label: "Total Consumption", enabled: true },
  { key: "rate", label: "Rate", enabled: true },
  { key: "lastUpdated", label: "Last Updated", enabled: true },
  { key: "ownerAddress", label: "Owner Address", enabled: false },
];

interface MeterExportRow {
  [key: string]: unknown;
  id: string;
  name: string;
  type: string;
  status: string;
  lastReading: string;
  totalConsumption: string;
  rate: string;
  lastUpdated: string;
  ownerAddress: string;
}

/** Projects a typed Meter into flat display strings for the export dialog. */
function toExportRow(meter: Meter): MeterExportRow {
  const unit = meterUnit(meter);
  return {
    id: meter.id,
    name: meter.name,
    type: meter.type,
    status: meter.status,
    lastReading: formatConsumption(meter.lastReading, unit),
    totalConsumption: formatConsumption(meter.totalConsumption, unit),
    rate: formatCurrency(meter.rate, "USD", 2),
    lastUpdated: meter.lastUpdated,
    ownerAddress: meter.ownerAddress,
  };
}

export function MetersPageClient() {
  const { data: meters, isLoading, error } = useMeters();
  const { toast } = useToast();

  const rows = meters ?? [];

  const tableColumns: DataTableColumn<Meter>[] = [
    { key: "id", header: "Meter ID", mobileTitle: true },
    { key: "name", header: "Name" },
    { key: "type", header: "Type" },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "lastReading",
      header: "Last Reading",
      align: "right",
      sortValue: (row) => row.lastReading,
      cell: (row) => formatConsumption(row.lastReading, meterUnit(row)),
    },
    {
      key: "totalConsumption",
      header: "Total Consumption",
      align: "right",
      sortValue: (row) => row.totalConsumption,
      cell: (row) => formatConsumption(row.totalConsumption, meterUnit(row)),
    },
    {
      key: "rate",
      header: "Rate",
      align: "right",
      sortValue: (row) => row.rate,
      cell: (row) => formatCurrency(row.rate, "USD", 2),
    },
    {
      key: "lastUpdated",
      header: "Last Updated",
      sortValue: (row) => row.lastUpdated,
      cell: (row) => (
        <time dateTime={row.lastUpdated}>{formatRelativeTime(row.lastUpdated)}</time>
      ),
    },
    {
      key: "ownerAddress",
      header: "Owner Address",
      sortable: false,
      hideOnMobile: true,
      searchValue: (row) => row.ownerAddress,
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5">
          <span className="font-mono text-xs">
            {formatStellarAddress(row.ownerAddress)}
          </span>
          <Tooltip content="Copy address">
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Copy owner address for ${row.name}`}
              className="px-1.5 py-1"
              onClick={() => {
                void navigator.clipboard.writeText(row.ownerAddress).then(
                  () =>
                    toast({
                      title: "Address copied",
                      description: row.ownerAddress,
                      variant: "success",
                    }),
                  () =>
                    toast({
                      title: "Copy failed",
                      description: "Clipboard access was denied.",
                      variant: "error",
                    })
                );
              }}
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </Tooltip>
        </span>
      ),
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Meters"
          description="Unable to load meters. Check your connection and try again."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Meters"
        description="View and manage your utility meters."
        actions={
          <ExportButton
            title="Meters"
            dataType="meters"
            columns={METER_COLUMNS}
            data={rows.map(toExportRow)}
            label="Export"
            variant="secondary"
          />
        }
      />

      <DataTable
        columns={tableColumns}
        rows={rows}
        getRowId={(row) => row.id}
        initialSortKey="name"
        loading={isLoading}
        emptyMessage="No meters registered yet"
        emptyDescription="Meters registered on the EquipChain contracts will appear here."
        searchPlaceholder="Search meters…"
        caption={`${rows.length} meters`}
        ariaLabel="Utility meters"
        toolbar={
          <p className="inline-flex items-center gap-1.5 text-xs text-text-muted">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {rows.filter((m) => m.status === "Active").length} active
          </p>
        }
      />
    </div>
  );
}
