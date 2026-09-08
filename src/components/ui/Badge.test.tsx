import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, StatusBadge } from "./Badge";

describe("Badge", () => {
  it("renders children with the neutral variant by default", () => {
    render(<Badge>Draft</Badge>);
    const el = screen.getByText("Draft");
    expect(el).toHaveClass("bg-surface-tertiary");
    expect(el).toHaveClass("rounded-full");
  });

  it("applies the requested variant classes", () => {
    render(<Badge variant="error">Overdue</Badge>);
    expect(screen.getByText("Overdue")).toHaveClass("bg-error-light");
  });

  it("merges custom classNames with variant classes", () => {
    render(
      <Badge variant="success" className="mt-2">
        OK
      </Badge>
    );
    const el = screen.getByText("OK");
    expect(el).toHaveClass("bg-success-light");
    expect(el).toHaveClass("mt-2");
  });

  it("forwards extra props such as title for tooltips", () => {
    render(<Badge title="Payment cleared">Paid</Badge>);
    expect(screen.getByText("Paid")).toHaveAttribute("title", "Payment cleared");
  });
});

describe("StatusBadge", () => {
  it.each([
    ["Active", "bg-success-light"],
    ["Streaming", "bg-success-light"],
    ["Paid", "bg-success-light"],
    ["Pending", "bg-warning-light"],
    ["Paused", "bg-warning-light"],
    ["Overdue", "bg-error-light"],
    ["Failed", "bg-error-light"],
    ["Inactive", "bg-surface-tertiary"],
  ])("maps %s to the correct palette", (status, expectedClass) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(status)).toHaveClass(expectedClass);
  });

  it("falls back to neutral for unknown statuses", () => {
    render(<StatusBadge status="Maintenance" />);
    expect(screen.getByText("Maintenance")).toHaveClass("bg-surface-tertiary");
  });
});
