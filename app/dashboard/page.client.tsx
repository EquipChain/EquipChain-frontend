"use client";

import { ExportButton } from "@/src/components/export/ExportButton";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { Card } from "@/src/components/ui/Card";
import { StatusBadge } from "@/src/components/ui/Badge";

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

const TREND_VARIANT = { up: "success", down: "error", stable: "neutral" } as const;

export function DashboardPageClient() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your utility meters, usage statistics, and recent activity."
        actions={
          <ExportButton
            title="Dashboard Summary"
            dataType="meters"
            columns={DASHBOARD_COLUMNS}
            data={sampleDashboardData}
            label="Export"
            variant="secondary"
          />
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sampleDashboardData.map((item) => (
          <Card key={item.label}>
            <p className="text-sm text-text-muted">{item.label}</p>
            <p className="mt-1 text-2xl font-bold text-text-primary">
              {item.value}
            </p>
            <div className="mt-1">
              <StatusBadge status={item.change} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
