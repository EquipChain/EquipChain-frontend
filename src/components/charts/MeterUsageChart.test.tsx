import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeterUsageChart } from "./MeterUsageChart";

// jsdom lacks ResponsiveContainer measurement; recharts renders with zero
// size but the bucket logic and states remain fully testable.
const SERIES = [
  { date: "2026-03-01", reading: 100 },
  { date: "2026-03-02", reading: 150 },
  { date: "2026-03-08", reading: 300 },
  { date: "2026-03-09", reading: 360 },
];

describe("MeterUsageChart", () => {
  it("renders the bucket switcher and empty-state guard", async () => {
    render(<MeterUsageChart data={SERIES} unit="kWh" />);
    expect(screen.getByRole("radiogroup", { name: "Usage bucket size" })).toBeInTheDocument();
  });

  it("shows a no-data state when the series is empty", () => {
    render(<MeterUsageChart data={[]} unit="kWh" />);
    expect(screen.getByRole("status")).toHaveTextContent(/no usage data/i);
  });

  it("renders the chart container with an accessible label", () => {
    render(<MeterUsageChart data={SERIES} unit="kWh" />);
    expect(screen.getByRole("img", { name: "Meter consumption by period" })).toBeInTheDocument();
  });

  it("switches buckets without crashing and keeps the radio state", async () => {
    const user = userEvent.setup();
    render(<MeterUsageChart data={SERIES} unit="kWh" />);

    await user.click(screen.getByRole("radio", { name: "Daily" }));
    expect(screen.getByRole("radio", { name: "Daily" })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: "Monthly" }));
    expect(screen.getByRole("radio", { name: "Monthly" })).toBeChecked();
  });
});

// Bucketing math itself is covered exhaustively in src/lib/utils/bucket.test.ts
