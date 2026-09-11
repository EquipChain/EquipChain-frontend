import { describe, expect, it, vi, afterEach } from "vitest";
import {
  formatNumber,
  formatCompactNumber,
  formatCurrency,
  formatPercent,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatConsumption,
  formatStellarAddress,
  formatBytes,
} from "./format";

afterEach(() => {
  vi.useRealTimers();
});

describe("formatNumber", () => {
  it("groups digits with commas", () => {
    expect(formatNumber(125000)).toBe("125,000");
  });

  it("supports fraction digits", () => {
    expect(formatNumber(1250.456, 2)).toBe("1,250.46");
  });

  it("handles zero and negatives", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(-42)).toBe("-42");
  });
});

describe("formatCompactNumber", () => {
  it("compacts thousands", () => {
    expect(formatCompactNumber(15420)).toBe("15.4K");
  });

  it("compacts millions", () => {
    expect(formatCompactNumber(1250000)).toBe("1.3M");
  });

  it("leaves small numbers alone", () => {
    expect(formatCompactNumber(42)).toBe("42");
  });
});

describe("formatCurrency", () => {
  it("formats USD with 2 decimals", () => {
    expect(formatCurrency(1494)).toBe("$1,494.00");
  });

  it("supports other currencies", () => {
    expect(formatCurrency(9.5, "EUR")).toBe("€9.50");
  });
});

describe("formatPercent", () => {
  it("adds a plus sign for positive values", () => {
    expect(formatPercent(5.32)).toBe("+5.3%");
  });

  it("keeps the minus sign for negative values", () => {
    expect(formatPercent(-3.2)).toBe("-3.2%");
  });

  it("has no sign for zero", () => {
    expect(formatPercent(0)).toBe("0.0%");
  });
});

describe("formatDate", () => {
  it("formats ISO strings as MMM d, yyyy", () => {
    expect(formatDate("2024-03-15")).toBe("Mar 15, 2024");
  });

  it("accepts Date objects", () => {
    expect(formatDate(new Date(2024, 2, 15))).toBe("Mar 15, 2024");
  });

  it("returns raw input when unparseable", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });
});

describe("formatDateTime", () => {
  it("includes time with AM/PM", () => {
    expect(formatDateTime("2024-03-15T14:32:00")).toBe(
      "Mar 15, 2024, 2:32 PM"
    );
  });

  it("returns raw input when unparseable", () => {
    expect(formatDateTime("garbage")).toBe("garbage");
  });
});

describe("formatRelativeTime", () => {
  it("renders 'X min ago' for recent dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-03-15T14:37:00"));
    expect(formatRelativeTime("2024-03-15T14:32:00")).toMatch(/minutes ago/);
  });

  it("falls back to an absolute date beyond 7 days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-04-01T00:00:00"));
    expect(formatRelativeTime("2024-03-15T14:32:00")).toBe("Mar 15, 2024");
  });
});

describe("formatConsumption", () => {
  it("groups value digits and keeps the unit verbatim", () => {
    expect(formatConsumption(125000, "kWh")).toBe("125,000 kWh");
    expect(formatConsumption(45, "m³")).toBe("45 m³");
  });
});

describe("formatStellarAddress", () => {
  const address = "GABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLM";

  it("truncates long addresses to head...tail", () => {
    expect(formatStellarAddress(address)).toBe("GABC...JKLM");
  });

  it("leaves short strings unmodified", () => {
    expect(formatStellarAddress("GABC")).toBe("GABC");
  });
});

describe("formatBytes", () => {
  it("formats bytes below 1 KB", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(1048576)).toBe("1.0 MB");
  });
});
