import { describe, expect, it } from "vitest";
import {
  formatDateLocale,
  formatDateTimeLocale,
  formatMonthYearLocale,
} from "./format";

describe("formatDateLocale", () => {
  it("formats medium dates in en-US by default", () => {
    expect(formatDateLocale("2026-03-15")).toBe("Mar 15, 2026");
  });

  it("orders components per locale (day-first for de-DE)", () => {
    // Node's ICU may render de-DE medium dates numerically ("15.03.2026")
    // or with month names ("15. März 2026"); the locale guarantee being
    // pinned is day-first ordering, not the exact style.
    const formatted = formatDateLocale("2026-03-15", "de-DE");
    expect(formatted.startsWith("15")).toBe(true);
    expect(formatted).not.toBe("Mar 15, 2026");
  });

  it("accepts Date objects", () => {
    expect(formatDateLocale(new Date(Date.UTC(2026, 2, 15)))).toBe("Mar 15, 2026");
  });

  it("returns raw input when unparseable", () => {
    expect(formatDateLocale("not-a-date")).toBe("not-a-date");
  });
});

describe("formatDateTimeLocale", () => {
  it("includes date and time in en-US", () => {
    const formatted = formatDateTimeLocale("2026-03-15T14:32:00Z");
    expect(formatted).toMatch(/Mar 15, 2026/);
    expect(formatted).toMatch(/2:32/);
  });

  it("renders 24-hour time for de-DE", () => {
    const formatted = formatDateTimeLocale("2026-03-15T14:32:00Z", "de-DE");
    expect(formatted).toMatch(/14:32/);
    expect(formatted).not.toMatch(/PM/i);
  });

  it("returns raw input when unparseable", () => {
    expect(formatDateTimeLocale("garbage")).toBe("garbage");
  });
});

describe("formatMonthYearLocale", () => {
  it("renders month + year in en-US", () => {
    expect(formatMonthYearLocale("2026-03-01")).toBe("Mar 2026");
  });

  it("localizes for other locales", () => {
    expect(formatMonthYearLocale("2026-03-01", "de-DE")).toMatch(/Mär/i);
  });

  it("returns raw input when unparseable", () => {
    expect(formatMonthYearLocale("junk")).toBe("junk");
  });
});
