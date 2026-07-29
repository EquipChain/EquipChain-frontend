"use client";

import { ExportButton } from "@/src/components/export/ExportButton";

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
const sampleStreamData = [
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

export function StreamsPageClient() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-8 py-32 px-16 w-full max-w-5xl">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-4xl font-bold text-black dark:text-zinc-50">
              Streams
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              Monitor real-time data streams from your utility meters.
            </p>
          </div>
          <ExportButton
            title="Streams"
            dataType="streams"
            columns={STREAM_COLUMNS}
            data={sampleStreamData}
            label="Export"
            variant="secondary"
          />
        </div>

        {/* Data table placeholder */}
        <div className="w-full border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary border-b border-border">
              <tr>
                {STREAM_COLUMNS.filter((c) => c.enabled).map((col) => (
                  <th
                    key={col.key}
                    className="text-left px-4 py-3 font-medium text-text-secondary"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sampleStreamData.map((stream) => (
                <tr
                  key={stream.id}
                  className="border-b border-border-light hover:bg-surface-secondary transition-colors"
                >
                  <td className="px-4 py-3 text-text-primary font-mono text-xs">
                    {stream.id}
                  </td>
                  <td className="px-4 py-3 text-text-primary">
                    {stream.meterId}
                  </td>
                  <td className="px-4 py-3 text-text-primary">{stream.type}</td>
                  <td className="px-4 py-3 text-text-primary">
                    {stream.flowRate}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        stream.status === "Streaming"
                          ? "bg-success-light text-success-dark dark:bg-green-900/20 dark:text-green-400"
                          : "bg-warning-light text-warning-dark dark:bg-yellow-900/20 dark:text-yellow-400"
                      }`}
                    >
                      {stream.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {stream.lastData}
                  </td>
                  <td className="px-4 py-3 text-text-primary">
                    {stream.uptime}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
