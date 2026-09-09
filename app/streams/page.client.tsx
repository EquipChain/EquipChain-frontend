"use client";

import { ExportButton } from "@/src/components/export/ExportButton";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { DataTable, type DataTableColumn } from "@/src/components/ui/DataTable";
import { StatusBadge } from "@/src/components/ui/Badge";

// Sample stream columns for export
const STREAM_COLUMNS = [
  { key: "id", label: "Stream ID", enabled: true },
  { key: "meterId", label: "Meter ID", enabled: true },
  { key: "type", label: "Type", enabled: true },
  { key: "flowRate", label: "Flow Rate", enabled: true },
  { key: "status", label: "Status", enabled: true },
  { key: "lastData", label: "Last Data Point", enabled: true },
  { key: "uptime", label: "Uptime", enabled: true },
  { key: "startedAt", label: "Started", enabled: false },
];

// Placeholder data — replace with actual API data fetching
interface StreamRow {
  [key: string]: unknown;
  id: string;
  meterId: string;
  type: string;
  flowRate: string;
  status: string;
  lastData: string;
  uptime: string;
  startedAt: string;
}

const sampleStreamData: StreamRow[] = [
  {
    id: "stream-001",
    meterId: "meter-001",
    type: "Real-time",
    flowRate: "1.2 kWh/min",
    status: "Streaming",
    lastData: "2024-03-15 14:32",
    uptime: "99.8%",
    startedAt: "2024-01-01",
  },
  {
    id: "stream-002",
    meterId: "meter-002",
    type: "Batch",
    flowRate: "0.8 gal/min",
    status: "Streaming",
    lastData: "2024-03-15 14:30",
    uptime: "99.5%",
    startedAt: "2024-01-15",
  },
  {
    id: "stream-003",
    meterId: "meter-003",
    type: "Real-time",
    flowRate: "0.5 m³/min",
    status: "Paused",
    lastData: "2024-03-14 09:15",
    uptime: "87.3%",
    startedAt: "2024-02-01",
  },
];

/** Pulsing dot for live streams; static dot otherwise. */
function LiveIndicator({ live }: { live: boolean }) {
  return (
    <span className="relative inline-flex h-2 w-2" aria-hidden="true">
      {live && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
      )}
      <span
        className={`relative inline-flex h-2 w-2 rounded-full ${
          live ? "bg-success" : "bg-text-muted"
        }`}
      />
    </span>
  );
}

const streamTableColumns: DataTableColumn<StreamRow>[] = [
  {
    key: "id",
    header: "Stream ID",
    mobileTitle: true,
    cell: (row) => <span className="font-mono text-xs">{row.id}</span>,
  },
  { key: "meterId", header: "Meter ID" },
  { key: "type", header: "Type" },
  { key: "flowRate", header: "Flow Rate", align: "right" },
  {
    key: "status",
    header: "Status",
    cell: (row) => (
      <span className="inline-flex items-center gap-2">
        <LiveIndicator live={row.status === "Streaming"} />
        <StatusBadge status={row.status} />
      </span>
    ),
  },
  { key: "lastData", header: "Last Data Point" },
  { key: "uptime", header: "Uptime", align: "right" },
  { key: "startedAt", header: "Started", sortable: false, hideOnMobile: true },
];

export function StreamsPageClient() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Streams"
        description="Monitor real-time data streams from your utility meters."
        actions={
          <ExportButton
            title="Streams"
            dataType="streams"
            columns={STREAM_COLUMNS}
            data={sampleStreamData}
            label="Export"
            variant="secondary"
          />
        }
      />

      <DataTable
        columns={streamTableColumns}
        rows={sampleStreamData}
        getRowId={(row) => row.id}
        initialSortKey="id"
        caption={`${sampleStreamData.length} streams`}
        ariaLabel="Data streams"
      />
    </div>
  );
}
