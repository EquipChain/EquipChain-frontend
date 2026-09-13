import { describe, expect, it } from "vitest";
import { sampleMeters, sampleReadingHistory } from "./demo";

describe("sampleReadingHistory", () => {
  it("produces one point per day ending at the meter's lastReading", () => {
    const meter = sampleMeters[0];
    const series = sampleReadingHistory(meter, 30);

    expect(series).toHaveLength(30);
    expect(series[series.length - 1].date).toBe("2026-03-15");
    expect(series[series.length - 1].reading).toBeCloseTo(meter.lastReading, 0);
  });

  it("is cumulative — readings never decrease", () => {
    const meter = sampleMeters[0];
    const series = sampleReadingHistory(meter, 30);

    for (let i = 1; i < series.length; i++) {
      expect(series[i].reading).toBeGreaterThanOrEqual(series[i - 1].reading);
    }
  });

  it("starts at or above zero", () => {
    for (const meter of sampleMeters) {
      const series = sampleReadingHistory(meter, 30);
      for (const point of series) {
        expect(point.reading).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("is deterministic across calls", () => {
    const meter = sampleMeters[1];
    expect(sampleReadingHistory(meter, 30)).toEqual(
      sampleReadingHistory(meter, 30)
    );
  });

  it("respects the requested day count", () => {
    const meter = sampleMeters[2];
    expect(sampleReadingHistory(meter, 7)).toHaveLength(7);
    expect(sampleReadingHistory(meter, 90)).toHaveLength(90);
  });
});
