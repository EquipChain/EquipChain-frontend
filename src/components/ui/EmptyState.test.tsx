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
});
