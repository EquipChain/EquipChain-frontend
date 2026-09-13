"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatCompactNumber,
  formatDate,
  formatMonthYearLocale,
} from "@/src/lib/utils/format";
import {
  KEY_BY_BUCKET,
  toUsageBuckets,
  type BucketSize,
  type UsagePoint,
} from "@/src/lib/utils/bucket";
import { SegmentedControl } from "@/src/components/ui/SegmentedControl";

// ============================================================================
// MeterUsageChart — period-bucketed consumption bars for one meter
// ============================================================================
// The reading history chart shows the cumulative curve; operators also ask
// the period question — "how much did this meter consume per week/month?"
// Buckets are derived client-side from the cumulative series so both charts
// always agree with each other and with the meter's headline numbers.

export type { UsagePoint };

export interface MeterUsageChartProps {
  data: UsagePoint[];
  /** Axis unit label, e.g. "kWh" */
  unit: string;
  ariaLabel?: string;
  height?: number;
}

interface TooltipEntry {
  active?: boolean;
  payload?: { payload: { label: string; consumption: number } }[];
}

function ChartTooltip({ active, payload, unit }: TooltipEntry & { unit: string }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-text-primary">{point.label}</p>
      <p className="text-text-secondary">
        {point.consumption.toLocaleString()} {unit}
      </p>
    </div>
  );
}

const BUCKET_LABEL_FORMAT: Record<BucketSize, (date: Date) => string> = {
  daily: (d) => formatDate(d.toISOString().slice(0, 10)),
  weekly: (d) => `wk of ${formatDate(d.toISOString().slice(0, 10))}`,
  // Locale-aware so the chart matches the rest of the date presentation.
  monthly: (d) => formatMonthYearLocale(d.toISOString().slice(0, 10)),
};

export function MeterUsageChart({
  data,
  unit,
  ariaLabel = "Meter consumption by period",
  height = 240,
}: MeterUsageChartProps) {
  const [bucket, setBucket] = useState<BucketSize>("weekly");

  const bucketed = useMemo(() => {
    if (data.length === 0) return [];
    // Attach display labels after aggregation.
    return toUsageBuckets(data, KEY_BY_BUCKET[bucket]).map((b) => ({
      ...b,
      label: BUCKET_LABEL_FORMAT[bucket](new Date(`${b.key}T00:00:00Z`)),
    }));
  }, [data, bucket]);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-border text-sm text-text-muted"
        style={{ height }}
        role="status"
      >
        No usage data for this meter yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SegmentedControl<BucketSize>
        ariaLabel="Usage bucket size"
        size="sm"
        value={bucket}
        onChange={setBucket}
        options={[
          { value: "daily", label: "Daily" },
          { value: "weekly", label: "Weekly" },
          { value: "monthly", label: "Monthly" },
        ]}
      />
      <div style={{ height }} role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bucketed} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
              minTickGap={16}
            />
            <YAxis
              tickFormatter={(value: number) => formatCompactNumber(value)}
              tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <RechartsTooltip content={<ChartTooltip unit={unit} />} />
            <Bar
              dataKey="consumption"
              fill="#2563eb"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
