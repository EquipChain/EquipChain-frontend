import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardContent } from "./Card";

describe("Card", () => {
  it("renders children with base surface classes", () => {
    render(
      <Card data-testid="card">
        <span>Body</span>
      </Card>
    );
    const card = screen.getByTestId("card");
    expect(card).toHaveClass("rounded-xl", "border-border", "bg-surface");
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("adds hover border only when interactive", () => {
    render(<Card data-testid="a">A</Card>);
    render(<Card interactive data-testid="b">B</Card>);
    expect(screen.getByTestId("a")).not.toHaveClass("hover:border-brand-300");
    expect(screen.getByTestId("b")).toHaveClass("hover:border-brand-300");
  });

  it("applies padding presets", () => {
    render(<Card padding="lg" data-testid="c">C</Card>);
    expect(screen.getByTestId("c")).toHaveClass("p-8");
  });

  it("defaults to md padding", () => {
    render(<Card data-testid="d">D</Card>);
    expect(screen.getByTestId("d")).toHaveClass("p-5");
  });

  it("forwards aria attributes", () => {
    render(
      <Card aria-labelledby="section-title">
        <h2 id="section-title">Meters</h2>
      </Card>
    );
    expect(screen.getByText("Meters")).toHaveAttribute(
      "id",
      "section-title"
    );
  });
});

describe("CardHeader", () => {
  it("renders title and description", () => {
    render(<CardHeader title="Usage" description="Last 30 days" />);
    expect(screen.getByText("Usage")).toBeInTheDocument();
    expect(screen.getByText("Last 30 days")).toBeInTheDocument();
  });

  it("renders actions on the right side", () => {
    render(
      <CardHeader
        title="Usage"
        actions={<button type="button">Export</button>}
      />
    );
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
  });
});

describe("CardContent", () => {
  it("renders children with top margin spacing", () => {
    render(
      <CardContent>
        <p>Details</p>
      </CardContent>
    );
    expect(screen.getByText("Details").parentElement).toHaveClass("mt-4");
  });
});
