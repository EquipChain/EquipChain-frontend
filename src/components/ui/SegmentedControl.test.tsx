import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SegmentedControl } from "./SegmentedControl";

const options = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

describe("SegmentedControl", () => {
  it("renders a radiogroup with radio options", () => {
    render(
      <SegmentedControl
        ariaLabel="Date range"
        options={options}
        value="day"
        onChange={vi.fn()}
      />
    );
    expect(screen.getByRole("radiogroup", { name: "Date range" })).toBeInTheDocument();
    for (const label of ["Day", "Week", "Month"]) {
      expect(screen.getByRole("radio", { name: label })).toBeInTheDocument();
    }
  });

  it("marks the selected option with aria-checked", () => {
    render(
      <SegmentedControl
        ariaLabel="Date range"
        options={options}
        value="week"
        onChange={vi.fn()}
      />
    );
    expect(screen.getByRole("radio", { name: "Week" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByRole("radio", { name: "Day" })).toHaveAttribute(
      "aria-checked",
      "false"
    );
  });

  it("emits onChange with the chosen value", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        ariaLabel="Date range"
        options={options}
        value="day"
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole("radio", { name: "Month" }));
    expect(onChange).toHaveBeenCalledWith("month");
  });

  it("hides visible labels in iconOnly mode but keeps the accessible name", () => {
    render(
      <SegmentedControl
        ariaLabel="Theme"
        options={[
          { value: "light", label: "Light", icon: <span data-testid="sun" /> },
          { value: "dark", label: "Dark", icon: <span data-testid="moon" /> },
        ]}
        value="light"
        onChange={vi.fn()}
        iconOnly
      />
    );
    // Accessible name comes from aria-label, not visible text
    expect(screen.getByRole("radio", { name: "Light" })).toBeInTheDocument();
    expect(screen.queryByText("Light")).not.toBeInTheDocument();
  });
});
