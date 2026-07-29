"use client";

import { ExportButton } from "@/src/components/export/ExportButton";

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
const sampleMeterData = [
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

export function MetersPageClient() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-8 py-32 px-16 w-full max-w-5xl">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-4xl font-bold text-black dark:text-zinc-50">
              Meters
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              View and manage your utility meters.
            </p>
          </div>
          <ExportButton
            title="Meters"
            dataType="meters"
            columns={METER_COLUMNS}
            data={sampleMeterData}
            label="Export"
            variant="secondary"
          />
        </div>

        {/* Data table placeholder */}
        <div className="w-full border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary border-b border-border">
              <tr>
                {METER_COLUMNS.filter((c) => c.enabled).map((col) => (
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
              {sampleMeterData.map((meter) => (
                <tr
                  key={meter.id}
                  className="border-b border-border-light hover:bg-surface-secondary transition-colors"
                >
                  <td className="px-4 py-3 text-text-primary">{meter.id}</td>
                  <td className="px-4 py-3 text-text-primary">{meter.name}</td>
                  <td className="px-4 py-3 text-text-primary">{meter.type}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        meter.status === "Active"
                          ? "bg-success-light text-success-dark dark:bg-green-900/20 dark:text-green-400"
                          : "bg-surface-tertiary text-text-muted"
                      }`}
                    >
                      {meter.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-primary">
                    {meter.lastReading}
                  </td>
                  <td className="px-4 py-3 text-text-primary">
                    {meter.totalConsumption}
                  </td>
                  <td className="px-4 py-3 text-text-primary">{meter.rate}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {meter.lastUpdated}
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
