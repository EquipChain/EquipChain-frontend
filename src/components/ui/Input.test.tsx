import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input, Label, Field } from "./Input";

describe("Input", () => {
  it("renders with base styling", () => {
    render(<Input placeholder="Meter ID" />);
    const input = screen.getByPlaceholderText("Meter ID");
    expect(input).toHaveClass("border-border");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("shows the error border and aria-invalid when error is set", () => {
    render(<Input error placeholder="Meter ID" />);
    const input = screen.getByPlaceholderText("Meter ID");
    expect(input).toHaveClass("border-error");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("supports controlled typing", async () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} aria-label="Reading" />);
    await userEvent.type(screen.getByLabelText("Reading"), "123");
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it("forwards refs", () => {
    let el: HTMLInputElement | null = null;
    render(
      <Input
        ref={(node) => {
          el = node;
        }}
      />
    );
    expect(el).toBeInstanceOf(HTMLInputElement);
  });
});

describe("Label", () => {
  it("associates with inputs via htmlFor", () => {
    render(
      <>
        <Label htmlFor="meter">Meter</Label>
        <Input id="meter" />
      </>
    );
    expect(screen.getByLabelText("Meter")).toBeInTheDocument();
  });

  it("shows the required asterisk with aria-hidden", () => {
    render(<Label required>Name</Label>);
    const star = screen.getByText("*");
    expect(star).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Field", () => {
  it("links label, input, and hint via generated ids", () => {
    render(<Field label="Rate" hint="USD per kWh" inputProps={{ placeholder: "0.12" }} />);
    const input = screen.getByLabelText("Rate");
    expect(input).toHaveAttribute("aria-describedby");
    expect(screen.getByText("USD per kWh")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("0.12")).toBeInTheDocument();
  });

  it("renders role=alert error message and invalid state", () => {
    render(<Field label="Rate" error="Rate must be positive" />);
    const input = screen.getByLabelText("Rate");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Rate must be positive"
    );
  });

  it("prefers error over hint when both provided", () => {
    render(
      <Field label="Rate" hint="USD per kWh" error="Bad value" />
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("USD per kWh")).not.toBeInTheDocument();
  });

  it("renders a textarea in multiline mode", () => {
    render(<Field label="Notes" multiline inputProps={{ rows: 3 }} />);
    const area = screen.getByLabelText("Notes");
    expect(area.tagName).toBe("TEXTAREA");
    expect(area).toHaveAttribute("rows", "3");
  });

  it("respects an explicit id from inputProps", () => {
    render(<Field label="Email" inputProps={{ id: "custom-email" }} />);
    expect(document.getElementById("custom-email")).toBeTruthy();
  });

  it("accepts typing", async () => {
    render(<Field label="Amount" />);
    await userEvent.type(screen.getByLabelText("Amount"), "42");
    expect(screen.getByLabelText("Amount")).toHaveValue("42");
  });
});
