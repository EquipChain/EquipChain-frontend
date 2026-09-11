import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Progress } from "./Progress";

describe("Progress", () => {
  it("exposes valuenow for determinate progress", () => {
    render(<Progress value={45} ariaLabel="Buffer level" />);
    const bar = screen.getByRole("progressbar", { name: "Buffer level" });
    expect(bar).toHaveAttribute("aria-valuenow", "45");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("clamps values above max", () => {
    render(<Progress value={150} ariaLabel="clamped" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("clamps negative values to zero", () => {
    render(<Progress value={-10} ariaLabel="negative" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("supports custom max", () => {
    render(<Progress value={7} max={10} ariaLabel="custom max" showValue />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "7");
    expect(screen.getByText("7 / 10")).toBeInTheDocument();
  });

  it("renders decimals with one place", () => {
    render(<Progress value={45.25} max={100} ariaLabel="decimal" showValue />);
    expect(screen.getByText("45.3 / 100")).toBeInTheDocument();
  });

  it("omits valuenow in indeterminate mode", () => {
    render(<Progress indeterminate ariaLabel="Loading data" />);
    const bar = screen.getByRole("progressbar", { name: "Loading data" });
    expect(bar).not.toHaveAttribute("aria-valuenow");
  });

  it("applies tone classes", () => {
    const { container } = render(
      <Progress value={50} tone="success" ariaLabel="tone" />
    );
    expect(container.querySelector(".bg-success")).not.toBeNull();
  });
});
