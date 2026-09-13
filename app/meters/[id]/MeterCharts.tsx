"use client";

import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/src/components/common/ErrorBoundary";

// ============================================================================
// MeterCharts — client wrapper for the detail page's lazy chart chunks
// ============================================================================
// The detail page is a Server Component, and next/dynamic with ssr:false is
// a client-only API (the build fails with "ssr: false is not allowed with
// next/dynamic in Server Components"). This wrapper owns the dynamic
// imports so recharts (~100KB gz) stays out of the initial payload while
// the server page stays a server component.

const MeterReadingHistoryChart = dynamic(
  () => import("@/src/components/charts/MeterReadingHistoryChart").then(
    (mod) => mod.MeterReadingHistoryChart
  ),
  {
    loading: () => (
      <div className="h-60 animate-pulse rounded-lg bg-surface-tertiary" aria-hidden="true" />
    ),
    ssr: false,
  }
);

const MeterUsageChart = dynamic(
  () => import("@/src/components/charts/MeterUsageChart").then(
    (mod) => mod.MeterUsageChart
  ),
  {
    loading: () => (
      <div className="h-60 animate-pulse rounded-lg bg-surface-tertiary" aria-hidden="true" />
    ),
    ssr: false,
  }
);

interface MeterChartsProps {
  /** Cumulative reading series shared by both charts */
  history: { date: string; reading: number }[];
  /** Axis unit label, e.g. "kWh" */
  unit: string;
  /** Meter display name for accessible chart labels */
  meterName: string;
}

export function MeterCharts({ history, unit, meterName }: MeterChartsProps) {
  return (
    <div className="space-y-10">
      <ErrorBoundary sectionName="reading history chart">
        <MeterReadingHistoryChart
          data={history}
          unit={unit}
          ariaLabel={`Cumulative readings for ${meterName} over the last 30 days`}
        />
      </ErrorBoundary>
      <ErrorBoundary sectionName="usage chart">
        <MeterUsageChart
          data={history}
          unit={unit}
          ariaLabel={`Consumption by period for ${meterName}`}
        />
      </ErrorBoundary>
    </div>
  );
}
