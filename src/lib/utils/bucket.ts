// ============================================================================
// Time-series bucketing — shared helpers for usage charts
// ============================================================================
// Charts aggregate cumulative readings into daily/weekly/monthly buckets.
// The math is pure (no React, no DOM) so it is directly unit-testable and
// any future chart that needs period grouping reuses it instead of
// reinventing week boundaries.

export interface UsagePoint {
  /** ISO date string, e.g. "2026-03-15" */
  date: string;
  /** Cumulative reading at that date */
  reading: number;
}

export interface UsageBucket {
  /** Bucket key as an ISO date string (bucket start) */
  key: string;
  /** Consumption within the bucket, in the meter's unit */
  consumption: number;
}

export type BucketSize = "daily" | "weekly" | "monthly";

/** Monday-based ISO week start key for a date. */
export function isoWeekKey(date: Date): string {
  const day = (date.getUTCDay() + 6) % 7;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - day);
  return monday.toISOString().slice(0, 10);
}

/** Month-start key for a date. */
export function monthKey(date: Date): string {
  return `${date.toISOString().slice(0, 7)}-01`;
}

/** Day key for a date (identity bucket). */
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Key function per bucket size. */
export const KEY_BY_BUCKET: Record<BucketSize, (date: Date) => string> = {
  daily: dayKey,
  weekly: isoWeekKey,
  monthly: monthKey,
};

/**
 * Diffs a cumulative reading series into per-bucket consumption totals.
 * Buckets appear in first-seen order; locally negative deltas (corrected
 * readings) are clamped so a bucket never reports negative consumption.
 */
export function toUsageBuckets(
  data: UsagePoint[],
  keyFor: (date: Date) => string
): UsageBucket[] {
  const order: string[] = [];
  const totals = new Map<string, number>();
  let previous = 0;

  for (const point of data) {
    const date = new Date(`${point.date}T00:00:00Z`);
    const key = keyFor(date);
    if (!totals.has(key)) {
      totals.set(key, 0);
      order.push(key);
    }
    const delta = Math.max(point.reading - previous, 0);
    totals.set(key, (totals.get(key) ?? 0) + delta);
    previous = point.reading;
  }

  return order.map((key) => ({
    key,
    consumption: Math.round(totals.get(key) ?? 0),
  }));
}
