import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatCard, StatCardSkeleton } from "./StatCard";

describe("StatCard", () => {
  it("renders label and value", () => {
    render(<StatCard label="Active Meters" value="12" />);
    expect(screen.getByText("Active Meters")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("infers an up trend from a positive change", () => {
    render(<StatCard label="Total Consumption" value="125,000" change={5.3} />);
    expect(screen.getByText("+5.3% vs last period")).toBeInTheDocument();
  });

  it("renders negative changes without a plus sign", () => {
    render(<StatCard label="Monthly Spend" value="$1,245" change={-3.2} />);
    expect(screen.getByText("-3.2% vs last period")).toBeInTheDocument();
  });

  it("treats zero change as stable", () => {
    render(<StatCard label="Active Streams" value="8" change={0} />);
    expect(screen.getByText("0% vs last period")).toBeInTheDocument();
  });

  it("supports absolute (non-percent) changes", () => {
    render(<StatCard label="Gas Buffer" value="45.2 XLM" change={12.1} changeIsPercent={false} />);
    expect(screen.getByText("+12.1 vs last period")).toBeInTheDocument();
  });

  it("exposes an accessible label", () => {
    render(<StatCard label="Active Meters" value="12" srLabel="12 active meters" />);
    expect(screen.getByLabelText("12 active meters")).toBeInTheDocument();
  });

  it("renders an optional icon slot", () => {
    render(
      <StatCard
        label="Pending Bills"
        value="3"
        icon={<span data-testid="custom-icon" />}
      />
    );
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });
});

describe("StatCardSkeleton", () => {
  it("renders a placeholder", () => {
    const { container } = render(<StatCardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
