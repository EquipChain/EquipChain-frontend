import { describe, expect, it } from "vitest";
import {
  dayKey,
  isoWeekKey,
  monthKey,
  toUsageBuckets,
} from "./bucket";

describe("isoWeekKey", () => {
  it("maps each date to its Monday", () => {
    // 2026-03-02 is a Monday; 03-08 is the following Sunday.
    expect(isoWeekKey(new Date("2026-03-02T00:00:00Z"))).toBe("2026-03-02");
    expect(isoWeekKey(new Date("2026-03-04T00:00:00Z"))).toBe("2026-03-02");
    expect(isoWeekKey(new Date("2026-03-08T00:00:00Z"))).toBe("2026-03-02");
    expect(isoWeekKey(new Date("2026-03-09T00:00:00Z"))).toBe("2026-03-09");
  });

  it("keeps week boundaries in UTC", () => {
    expect(isoWeekKey(new Date("2026-01-01T00:00:00Z"))).toBe("2025-12-29");
  });
});

describe("monthKey", () => {
  it("collapses dates to the first of the month", () => {
    expect(monthKey(new Date("2026-03-15T00:00:00Z"))).toBe("2026-03-01");
    expect(monthKey(new Date("2026-12-31T00:00:00Z"))).toBe("2026-12-01");
  });
});

describe("dayKey", () => {
  it("returns the ISO date portion", () => {
    expect(dayKey(new Date("2026-03-15T00:00:00Z"))).toBe("2026-03-15");
  });
});

describe("toUsageBuckets", () => {
  const series = [
    { date: "2026-03-01", reading: 100 },
    { date: "2026-03-02", reading: 150 },
    { date: "2026-03-08", reading: 300 },
    { date: "2026-03-09", reading: 360 },
  ];

  it("daily buckets equal per-day deltas", () => {
    const buckets = toUsageBuckets(series, dayKey);
    expect(buckets).toEqual([
      { key: "2026-03-01", consumption: 100 },
      { key: "2026-03-02", consumption: 50 },
      { key: "2026-03-08", consumption: 150 },
      { key: "2026-03-09", consumption: 60 },
    ]);
  });

  it("weekly buckets sum the deltas inside each Monday week", () => {
    const buckets = toUsageBuckets(series, isoWeekKey);
    expect(buckets).toEqual([
      { key: "2026-02-23", consumption: 100 },
      { key: "2026-03-02", consumption: 200 },
      { key: "2026-03-09", consumption: 60 },
    ]);
  });

  it("monthly buckets collapse a month into one total", () => {
    const buckets = toUsageBuckets(series, monthKey);
    expect(buckets).toEqual([{ key: "2026-03-01", consumption: 360 }]);
  });

  it("clamps locally negative deltas from corrected readings", () => {
    const corrected = [
      { date: "2026-03-01", reading: 200 },
      { date: "2026-03-02", reading: 150 }, // correction downward
      { date: "2026-03-03", reading: 180 },
    ];
    const buckets = toUsageBuckets(corrected, dayKey);
    expect(buckets).toEqual([
      { key: "2026-03-01", consumption: 200 },
      { key: "2026-03-02", consumption: 0 },
      { key: "2026-03-03", consumption: 30 },
    ]);
  });

  it("handles an empty series", () => {
    expect(toUsageBuckets([], dayKey)).toEqual([]);
  });

  it("rounds fractional consumption", () => {
    const fractional = [
      { date: "2026-03-01", reading: 10.4 },
      { date: "2026-03-02", reading: 20.7 },
    ];
    expect(toUsageBuckets(fractional, dayKey)).toEqual([
      { key: "2026-03-01", consumption: 10 },
      { key: "2026-03-02", consumption: 10 },
    ]);
  });
});
