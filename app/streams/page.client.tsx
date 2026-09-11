"use client";

import { ExportButton } from "@/src/components/export/ExportButton";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { DataTable, type DataTableColumn } from "@/src/components/ui/DataTable";
import { StatusBadge } from "@/src/components/ui/Badge";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { useStreams } from "@/src/lib/api/hooks";
import { formatRelativeTime, formatDateTime } from "@/src/lib/utils/format";
import type { DataStream } from "@/src/lib/types/domain";

// ============================================================================
// Streams page — typed table over the SWR data layer
// ============================================================================
// Previously this page inlined literal rows; "Last Data Point" rendered a
// stale absolute datetime string with no sense of recency, uptime sorted
// lexically ("99.8%" vs "87.3%"), and there was no indication of which
// streams were actually live. It now derives all of that from typed data.

const STREAM_COLUMNS = [
  { key: "id", label: "Stream ID", enabled: true },
  { key: "meterId", label: "Meter ID", enabled: true },
  { key: "type", label: "Type", enabled: true },
  { key: "flowRate", label: "Flow Rate", enabled: true },
  { key: "status", label: "Status", enabled: true },
  { key: "lastDataAt", label: "Last Data Point", enabled: true },
  { key: "uptime", label: "Uptime", enabled: true },
  { key: "startedAt", label: "Started", enabled: false },
];

interface StreamExportRow {
  [key: string]: unknown;
  id: string;
  meterId: string;
  type: string;
  flowRate: string;
  status: string;
  lastDataAt: string;
  uptime: string;
  startedAt: string;
}

function toExportRow(stream: DataStream): StreamExportRow {
  return {
    id: stream.id,
    meterId: stream.meterId,
    type: stream.type,
    flowRate: `${stream.flowRate}/min`,
    status: stream.status,
    lastDataAt: stream.lastDataAt,
    uptime: `${stream.uptime}%`,
    startedAt: stream.startedAt,
  };
}

/** Pulsing dot for live streams; static dot otherwise. */
function LiveIndicator({ live }: { live: boolean }) {
  return (
    <Tooltip content={live ? "Receiving data" : "Not receiving data"}>
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
    </Tooltip>
  );
}

export function StreamsPageClient() {
  const { data: streams, isLoading, error } = useStreams();

  const rows = streams ?? [];

  const tableColumns: DataTableColumn<DataStream>[] = [
    {
      key: "id",
      header: "Stream ID",
      mobileTitle: true,
      cell: (row) => <span className="font-mono text-xs">{row.id}</span>,
    },
    { key: "meterId", header: "Meter ID" },
    { key: "type", header: "Type" },
    {
      key: "flowRate",
      header: "Flow Rate",
      align: "right",
      sortValue: (row) => row.flowRate,
      cell: (row) => `${row.flowRate}/min`,
    },
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
    {
      key: "lastDataAt",
      header: "Last Data Point",
      sortValue: (row) => row.lastDataAt,
      cell: (row) => (
        <time dateTime={row.lastDataAt} title={formatDateTime(row.lastDataAt)}>
          {formatRelativeTime(row.lastDataAt)}
        </time>
      ),
    },
    {
      key: "uptime",
      header: "Uptime",
      align: "right",
      sortValue: (row) => row.uptime,
      cell: (row) => `${row.uptime}%`,
    },
    {
      key: "startedAt",
      header: "Started",
      sortable: false,
      hideOnMobile: true,
      cell: (row) => (
        <time dateTime={row.startedAt}>{formatRelativeTime(row.startedAt)}</time>
      ),
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Streams"
          description="Unable to load streams. Check your connection and try again."
        />
      </div>
    );
  }

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
        initialSortKey="id"
        loading={isLoading}
        emptyMessage="No data streams configured"
        emptyDescription="Streams are created when a meter starts publishing readings."
        searchPlaceholder="Search streams…"
        caption={`${rows.length} streams · ${rows.filter((s) => s.status === "Streaming").length} live`}
        ariaLabel="Data streams"
      />
    </div>
  );
}
