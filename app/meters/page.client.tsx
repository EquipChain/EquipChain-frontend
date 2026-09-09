"use client";

import { ExportButton } from "@/src/components/export/ExportButton";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { DataTable, type DataTableColumn } from "@/src/components/ui/DataTable";
import { StatusBadge } from "@/src/components/ui/Badge";

// Sample meter columns for export
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

// Placeholder data — replace with actual API data fetching
// (index signature keeps the rows compatible with ExportButton's data prop)
interface MeterRow {
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

const sampleMeterData: MeterRow[] = [
  {
    id: "meter-001",
    name: "Main Building",
    type: "Electric",
    status: "Active",
    lastReading: "15,420 kWh",
    totalConsumption: "125,000 kWh",
    rate: "$0.12/kWh",
    lastUpdated: "2024-03-15",
    ownerAddress: "GABC...XYZ",
  },
  {
    id: "meter-002",
    name: "Warehouse A",
    type: "Water",
    status: "Active",
    lastReading: "8,250 gal",
    totalConsumption: "92,000 gal",
    rate: "$0.05/gal",
    lastUpdated: "2024-03-15",
    ownerAddress: "GDEF...UVW",
  },
  {
    id: "meter-003",
    name: "Office Floor 2",
    type: "Gas",
    status: "Inactive",
    lastReading: "3,100 m³",
    totalConsumption: "45,000 m³",
    rate: "$0.08/m³",
    lastUpdated: "2024-03-14",
    ownerAddress: "GHIJ...RST",
  },
];

const meterTableColumns: DataTableColumn<MeterRow>[] = [
  { key: "id", header: "Meter ID", mobileTitle: true },
  { key: "name", header: "Name" },
  { key: "type", header: "Type" },
  {
    key: "status",
    header: "Status",
    cell: (row) => <StatusBadge status={row.status} />,
  },
  { key: "lastReading", header: "Last Reading", align: "right" },
  { key: "totalConsumption", header: "Total Consumption", align: "right" },
  { key: "rate", header: "Rate", align: "right" },
  { key: "lastUpdated", header: "Last Updated" },
  { key: "ownerAddress", header: "Owner Address", sortable: false, hideOnMobile: true },
];

export function MetersPageClient() {
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
            data={sampleMeterData}
            label="Export"
            variant="secondary"
          />
        }
      />

      <DataTable
        columns={meterTableColumns}
        rows={sampleMeterData}
        getRowId={(row) => row.id}
        initialSortKey="name"
        caption={`${sampleMeterData.length} meters`}
        ariaLabel="Utility meters"
      />
    </div>
  );
}
