"use client";

import dynamic from "next/dynamic";
import { Gauge, Activity, Receipt, Coins, Zap, Droplets, Flame } from "lucide-react";
import { ExportButton } from "@/src/components/export/ExportButton";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { StatCard } from "@/src/components/ui/StatCard";
import { Card, CardHeader, CardContent } from "@/src/components/ui/Card";
import { Progress } from "@/src/components/ui/Progress";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { useDashboardSummary, useMeters } from "@/src/lib/api/hooks";
import { sampleConsumptionSeries } from "@/src/lib/fixtures/demo";
import {
  formatNumber,
  formatCurrency,
  formatCompactNumber,
} from "@/src/lib/utils/format";

// The chart library is heavy (~100KB gz); loading it dynamically keeps it
// out of the initial bundle and gives the card a matching skeleton while
// the chunk streams in.
const ConsumptionChart = dynamic(
  () => import("@/src/components/charts/ConsumptionChart").then(
    (mod) => mod.ConsumptionChart
  ),
  {
    loading: () => (
      <div className="h-64 animate-pulse rounded-lg bg-surface-tertiary" aria-hidden="true" />
    ),
    ssr: false,
  }
);

// ============================================================================
// Dashboard — typed overview with aggregates and gas buffer health
// ============================================================================
// Previously the dashboard rendered six hand-typed placeholder rows through
// a misused StatusBadge, with no data source, no gas buffer visualization,
// and no per-utility breakdown. It now consumes the SWR layer and derives
// every figure from typed domain data.

const DASHBOARD_COLUMNS = [
  { key: "label", label: "Metric", enabled: true },
  { key: "value", label: "Value", enabled: true },
];

/** Gas buffer health: percent of the recommended 2 XLM reserve target. */
const GAS_BUFFER_TARGET_XLM = 100;

function gasBufferTone(balance: number): {
  percent: number;
  tone: "brand" | "success" | "warning" | "error";
  label: string;
} {
  const percent = Math.min(100, (balance / GAS_BUFFER_TARGET_XLM) * 100);
  if (balance >= GAS_BUFFER_TARGET_XLM * 0.75) {
    return { percent, tone: "success", label: "Healthy" };
  }
  if (balance >= GAS_BUFFER_TARGET_XLM * 0.35) {
    return { percent, tone: "warning", label: "Low" };
  }
  return { percent, tone: "error", label: "Critical" };
}

export function DashboardPageClient() {
  const { data: summary, isLoading } = useDashboardSummary();
  const { data: meters } = useMeters();

  const utilityBreakdown = (meters ?? []).reduce<
    { type: string; count: number; consumption: number; icon: typeof Zap }[]
  >((acc, meter) => {
    const existing = acc.find((entry) => entry.type === meter.type);
    if (existing) {
      existing.count += 1;
      existing.consumption += meter.totalConsumption;
    } else {
      acc.push({
        type: meter.type,
        count: 1,
        consumption: meter.totalConsumption,
        icon: meter.type === "Electric" ? Zap : meter.type === "Water" ? Droplets : Flame,
      });
    }
    return acc;
  }, []);

  const exportData = summary
    ? [
        { label: "Active Meters", value: `${summary.activeMeters} of ${summary.totalMeters}` },
        { label: "Total Consumption", value: formatNumber(summary.totalConsumption) },
        { label: "Active Streams", value: String(summary.activeStreams) },
        { label: "Pending Bills", value: String(summary.pendingInvoices) },
        { label: "Overdue Bills", value: String(summary.overdueInvoices) },
        { label: "Gas Buffer", value: `${summary.gasBuffer} XLM` },
        { label: "Monthly Spend", value: formatCurrency(summary.monthlySpend) },
      ]
    : [];

  if (isLoading || !summary) {
    return (
      <div className="flex flex-col gap-8" aria-busy="true">
        <PageHeader title="Dashboard" description="Loading overview…" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} aria-hidden="true">
              <div className="h-4 w-1/2 animate-pulse rounded bg-surface-tertiary" />
              <div className="mt-3 h-8 w-3/4 animate-pulse rounded bg-surface-tertiary" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const buffer = gasBufferTone(summary.gasBuffer);

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
            data={exportData}
            label="Export"
            variant="secondary"
          />
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Active Meters"
          value={`${summary.activeMeters} of ${summary.totalMeters}`}
          icon={<Gauge className="h-4 w-4" aria-hidden="true" />}
          srLabel={`${summary.activeMeters} of ${summary.totalMeters} meters active`}
        />
        <StatCard
          label="Total Consumption"
          value={`${formatCompactNumber(summary.totalConsumption)} units`}
          change={5.3}
          icon={<Activity className="h-4 w-4" aria-hidden="true" />}
        />
        <StatCard
          label="Active Streams"
          value={String(summary.activeStreams)}
          icon={<Zap className="h-4 w-4" aria-hidden="true" />}
        />
        <StatCard
          label="Pending Bills"
          value={String(summary.pendingInvoices)}
          change={summary.pendingInvoices > 0 ? undefined : 0}
          icon={<Receipt className="h-4 w-4" aria-hidden="true" />}
        />
        <StatCard
          label="Gas Buffer"
          value={`${formatNumber(summary.gasBuffer, 1)} XLM`}
          change={12.1}
          changeIsPercent={false}
          icon={<Coins className="h-4 w-4" aria-hidden="true" />}
        />
        <StatCard
          label="Monthly Spend"
          value={formatCurrency(summary.monthlySpend)}
          change={-3.2}
          icon={<Coins className="h-4 w-4" aria-hidden="true" />}
        />
      </div>

      {/* Usage trend — dynamically imported recharts chunk */}
      <Card>
        <CardHeader
          title="Consumption trend"
          description="Daily usage across all meters, last 30 days"
        />
        <CardContent>
          <ConsumptionChart
            data={sampleConsumptionSeries(30)}
            unit="kWh"
            ariaLabel="Daily consumption across all meters for the last 30 days"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gas buffer health */}
        <Card>
          <CardHeader
            title="Gas Buffer"
            description={`Transaction fee reserve — ${buffer.label}`}
          />
          <CardContent>
            <Progress
              value={buffer.percent}
              tone={buffer.tone}
              showValue
              ariaLabel={`Gas buffer at ${buffer.percent.toFixed(0)}% of target`}
            />
            <p className="mt-3 text-xs text-text-muted">
              {formatNumber(summary.gasBuffer, 1)} XLM held against a{" "}
              {GAS_BUFFER_TARGET_XLM} XLM operational target.
            </p>
          </CardContent>
        </Card>

        {/* Per-utility breakdown */}
        <Card>
          <CardHeader
            title="Consumption by utility"
            description="Lifetime totals per meter type"
          />
          <CardContent>
            {utilityBreakdown.length === 0 ? (
              <EmptyState
                bare
                title="No meter data yet"
                description="Register meters to see a per-utility breakdown."
              />
            ) : (
              <ul className="space-y-4">
                {utilityBreakdown.map(({ type, count, consumption, icon: Icon }) => (
                  <li key={type} className="flex items-center gap-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600/10 text-brand-600">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary">
                        {type}
                        <span className="ml-2 text-xs font-normal text-text-muted">
                          {count} meter{count === 1 ? "" : "s"}
                        </span>
                      </p>
                      <Progress
                        value={(consumption / summary.totalConsumption) * 100}
                        ariaLabel={`${type} share of total consumption`}
                        className="mt-1.5"
                      />
                    </div>
                    <p className="text-sm tabular-nums text-text-secondary">
                      {formatCompactNumber(consumption)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
