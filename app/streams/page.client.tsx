"use client";

import { useSWRConfig } from "swr";
import { useMemo, useState } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { ExportButton } from "@/src/components/export/ExportButton";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { DataTable, type DataTableColumn } from "@/src/components/ui/DataTable";
import { StatusBadge } from "@/src/components/ui/Badge";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { LiveRelativeTime } from "@/src/components/common/LiveRelativeTime";
import { useStreams } from "@/src/lib/api/hooks";
import { formatRelativeTime } from "@/src/lib/utils/format";
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
  const { data: streams, isLoading, error, mutate } = useStreams();
  const { mutate: globalMutate } = useSWRConfig();
  const [statusFilter, setStatusFilter] = useState<"all" | DataStream["status"]>("all");

  // Stable identity so the filter useMemo does not recompute on unrelated
  // renders when SWR has not refetched.
  const allStreams = useMemo(() => streams ?? [], [streams]);
  // Status filter narrows the table client-side; the caption still reports
  // the total so a filtered view never hides fleet-wide liveness.
  const rows = useMemo(
    () =>
      statusFilter === "all"
        ? allStreams
        : allStreams.filter((stream) => stream.status === statusFilter),
    [allStreams, statusFilter]
  );

  const liveCount = allStreams.filter((s) => s.status === "Streaming").length;

  const filterButtons: { value: "all" | DataStream["status"]; label: string; count: number }[] = [
    { value: "all", label: "All", count: allStreams.length },
    { value: "Streaming", label: "Streaming", count: allStreams.filter((s) => s.status === "Streaming").length },
    { value: "Paused", label: "Paused", count: allStreams.filter((s) => s.status === "Paused").length },
    { value: "Failed", label: "Failed", count: allStreams.filter((s) => s.status === "Failed").length },
    { value: "Offline", label: "Offline", count: allStreams.filter((s) => s.status === "Offline").length },
  ];

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
      cell: (row) => <LiveRelativeTime datetime={row.lastDataAt} />,
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
        {/* Retry re-runs the failed fetch through the same cache key without
            a full page reload; globalMutate covers any dependent hooks. */}
        <EmptyState
          bare
          icon={<CloudOff className="h-6 w-6 text-text-muted" />}
          title="Couldn't load streams"
          description="This was a fetch failure, not an empty dataset. Retrying is safe."
          action={
            <Button
              variant="outline"
              onClick={() => {
                void mutate();
                void globalMutate(
                  (key) => typeof key === "string" && key.startsWith("streams")
                );
              }}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </Button>
          }
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
        caption={`${rows.length} of ${allStreams.length} streams · ${liveCount} live`}
        ariaLabel="Data streams"
        toolbar={
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by status">
            {filterButtons.map(({ value, label, count }) => {
              const active = statusFilter === value;
              return (
                <Button
                  key={value}
                  variant={active ? "primary" : "ghost"}
                  size="sm"
                  aria-pressed={active}
                  onClick={() => setStatusFilter(value)}
                >
                  {label}
                  <span className="ml-1 text-xs opacity-70">{count}</span>
                </Button>
              );
            })}
          </div>
        }
      />
    </div>
  );
}
