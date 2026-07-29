"use client";

import { ExportButton } from "@/src/components/export/ExportButton";

// Sample dashboard summary columns for export
const DASHBOARD_COLUMNS = [
  { key: "label", label: "Metric", enabled: true },
  { key: "value", label: "Value", enabled: true },
  { key: "change", label: "Change", enabled: true },
  { key: "trend", label: "Trend", enabled: true },
];

// Placeholder data — replace with actual API data fetching
const sampleDashboardData = [
  { label: "Active Meters", value: "12", change: "+2", trend: "up" },
  { label: "Total Consumption", value: "262,000 kWh", change: "+5.3%", trend: "up" },
  { label: "Active Streams", value: "8", change: "0", trend: "stable" },
  { label: "Pending Bills", value: "3", change: "-1", trend: "down" },
  { label: "Gas Buffer", value: "45.2 XLM", change: "+12.1", trend: "up" },
  { label: "Monthly Spend", value: "$1,245.80", change: "-3.2%", trend: "down" },
];

export function DashboardPageClient() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-8 py-32 px-16 w-full max-w-5xl">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-4xl font-bold text-black dark:text-zinc-50">
              Dashboard
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              Overview of your utility meters, usage statistics, and recent activity.
            </p>
          </div>
          <ExportButton
            title="Dashboard Summary"
            dataType="meters"
            columns={DASHBOARD_COLUMNS}
            data={sampleDashboardData}
            label="Export"
            variant="secondary"
          />
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {sampleDashboardData.map((item) => (
            <div
              key={item.label}
              className="p-5 border border-border rounded-xl bg-surface hover:border-brand-300 transition-colors"
            >
              <p className="text-sm text-text-muted">{item.label}</p>
              <p className="text-2xl font-bold text-text-primary mt-1">
                {item.value}
              </p>
              <p
                className={`text-sm mt-1 ${
                  item.trend === "up"
                    ? "text-success"
                    : item.trend === "down"
                      ? "text-error"
                      : "text-text-muted"
                }`}
              >
                {item.change}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
