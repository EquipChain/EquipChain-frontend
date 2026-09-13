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
// MeterReadingHistoryChart — cumulative readings for a single meter
// ============================================================================
// The meter detail page showed only the latest reading as a static number.
// A cumulative series makes device behavior visible: flat segments mean no
// data, steep segments mean heavy use. Rendered as a step-style area so
// individual reading events read as distinct increments.

export interface ReadingPoint {
  /** ISO date string for the reading */
  date: string;
  /** Cumulative meter value at that date */
  reading: number;
}

export interface MeterReadingHistoryChartProps {
  data: ReadingPoint[];
  /** Axis unit label, e.g. "kWh" */
  unit: string;
  ariaLabel?: string;
  height?: number;
}

interface TooltipEntry {
  active?: boolean;
  payload?: { payload: ReadingPoint }[];
}

function ChartTooltip({ active, payload, unit }: TooltipEntry & { unit: string }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-text-primary">{formatDate(point.date)}</p>
      <p className="text-text-secondary">
        {point.reading.toLocaleString()} {unit}
      </p>
    </div>
  );
}

export function MeterReadingHistoryChart({
  data,
  unit,
  ariaLabel = "Meter reading history",
  height = 240,
}: MeterReadingHistoryChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-border text-sm text-text-muted"
        style={{ height }}
        role="status"
      >
        No reading history for this meter yet.
      </div>
    );
  }

  return (
    <div style={{ height }} role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="readingFill" x1="0" y1="0" x2="0" y2="1">
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
            domain={["auto", "auto"]}
            tickFormatter={(value: number) => formatCompactNumber(value)}
            tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <RechartsTooltip content={<ChartTooltip unit={unit} />} />
          <Area
            type="stepAfter"
            dataKey="reading"
            stroke="#2563eb"
            strokeWidth={2}
            fill="url(#readingFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
