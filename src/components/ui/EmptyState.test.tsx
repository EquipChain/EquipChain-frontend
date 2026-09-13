import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Gauge } from "lucide-react";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders title and default icon", () => {
    render(<EmptyState title="No meters yet" />);
    expect(screen.getByText("No meters yet")).toBeInTheDocument();
  });

  it("renders description and action when provided", () => {
    render(
      <EmptyState
        title="No invoices"
        description="Invoices appear after your first billing period."
        action={<button type="button">Register a meter</button>}
      />
    );
    expect(
      screen.getByText("Invoices appear after your first billing period.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Register a meter" })
    ).toBeInTheDocument();
  });

  it("accepts a custom icon", () => {
    render(<EmptyState title="No meters" icon={<Gauge data-testid="custom-icon" />} />);
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("renders the compact icon chip by default", () => {
    render(<EmptyState title="Empty" />);
    const chip = screen.getByText("Empty").closest("div")?.parentElement?.querySelector("[aria-hidden]");
    expect(chip).not.toBeNull();
    expect(chip).not.toHaveClass("relative");
  });

  it("renders the framed illustration variant when requested", () => {
    const { container } = render(
      <EmptyState title="Nothing here" visual="illustration" />
    );
    // The illustration frame is a 24x24 (h-24 w-24) decorative element.
    const frame = container.querySelector(".h-24.w-24");
    expect(frame).not.toBeNull();
    expect(frame).toHaveAttribute("aria-hidden", "true");
  });

  it("uses the custom icon inside the illustration frame", () => {
    render(
      <EmptyState
        title="Nothing here"
        visual="illustration"
        icon={<Gauge data-testid="frame-icon" />}
      />
    );
    expect(screen.getByTestId("frame-icon")).toBeInTheDocument();
  });
});
