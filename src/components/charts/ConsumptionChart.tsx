"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactNumber, formatDate } from "@/src/lib/utils/format";

// ============================================================================
// ConsumptionChart — area chart of metered usage over time
// ============================================================================
// The dashboard previously had no visualization at all; usage trends lived
// only in text deltas. This chart is dynamically imported by the dashboard
// so recharts (~100KB gz) never lands in the initial bundle.

export interface ConsumptionPoint {
  /** ISO date string for the bucket */
  date: string;
  /** Consumption in the charted unit */
  value: number;
}

export interface ConsumptionChartProps {
  data: ConsumptionPoint[];
  /** Axis unit label, e.g. "kWh" */
  unit: string;
  ariaLabel?: string;
  height?: number;
}

interface TooltipEntry {
  active?: boolean;
  payload?: { payload: ConsumptionPoint }[];
}

function ChartTooltip({ active, payload, unit }: TooltipEntry & { unit: string }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-text-primary">{formatDate(point.date)}</p>
      <p className="text-text-secondary">
        {point.value.toLocaleString()} {unit}
      </p>
    </div>
  );
}

export function ConsumptionChart({
  data,
  unit,
  ariaLabel = "Consumption over time",
  height = 280,
}: ConsumptionChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-border text-sm text-text-muted"
        style={{ height }}
        role="status"
      >
        No consumption data for this period.
      </div>
    );
  }

  return (
    <div style={{ height }} role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="consumptionFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => formatDate(value)}
            tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--color-border)" }}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={(value: number) => formatCompactNumber(value)}
            tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <RechartsTooltip content={<ChartTooltip unit={unit} />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#2563eb"
            strokeWidth={2}
            fill="url(#consumptionFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
