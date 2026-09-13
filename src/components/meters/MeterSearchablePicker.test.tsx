import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeterSearchablePicker, type MeterOption } from "./MeterSearchablePicker";

const OPTIONS: MeterOption[] = [
  { id: "meter-001", name: "Main Building", meta: "Electric" },
  { id: "meter-002", name: "Warehouse A", meta: "Water" },
  { id: "meter-003", name: "Office Floor 2", meta: "Gas" },
];

describe("MeterSearchablePicker", () => {
  it("renders the combobox with a label", () => {
    render(
      <MeterSearchablePicker
        value=""
        onChange={() => {}}
        options={OPTIONS}
      />
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Meter")).toBeInTheDocument();
  });

  it("opens the listbox on focus and lists all meters", async () => {
    const user = userEvent.setup();
    render(
      <MeterSearchablePicker
        value=""
        onChange={() => {}}
        options={OPTIONS}
      />
    );
    await user.click(screen.getByRole("combobox"));
    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("filters by name substring, not just prefix", async () => {
    const user = userEvent.setup();
    render(
      <MeterSearchablePicker
        value=""
        onChange={() => {}}
        options={OPTIONS}
      />
    );
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "warehouse");
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Warehouse A");
  });

  it("filters by meter id", async () => {
    const user = userEvent.setup();
    render(
      <MeterSearchablePicker
        value=""
        onChange={() => {}}
        options={OPTIONS}
      />
    );
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "meter-003");
    expect(screen.getAllByRole("option")).toHaveLength(1);
  });

  it("shows a no-match message for unknown queries", async () => {
    const user = userEvent.setup();
    render(
      <MeterSearchablePicker
        value=""
        onChange={() => {}}
        options={OPTIONS}
      />
    );
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "zzz");
    expect(screen.getByRole("option")).toHaveTextContent(/no meters match/i);
  });

  it("selects an option on click and reports the meter id", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MeterSearchablePicker
        value=""
        onChange={onChange}
        options={OPTIONS}
      />
    );
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByText("Warehouse A"));
    expect(onChange).toHaveBeenCalledWith("meter-002");
  });

  it("selects the active option with Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MeterSearchablePicker
        value=""
        onChange={onChange}
        options={OPTIONS}
      />
    );
    const input = screen.getByRole("combobox");
    await user.click(input);
    // List opens with the first option active; one ArrowDown moves to the
    // second option, Enter commits it.
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenCalledWith("meter-002");
  });

  it("closes the listbox with Escape without selecting", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MeterSearchablePicker
        value=""
        onChange={onChange}
        options={OPTIONS}
      />
    );
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("marks the selected option with aria-selected and shows the label when closed", async () => {
    const user = userEvent.setup();
    render(
      <MeterSearchablePicker
        value="meter-003"
        onChange={() => {}}
        options={OPTIONS}
      />
    );
    await user.click(screen.getByRole("combobox"));
    const option = screen.getByRole("option", { selected: true });
    expect(option).toHaveTextContent("Office Floor 2");

    await user.keyboard("{Escape}");
    expect(screen.getByRole("combobox")).toHaveValue(
      "meter-003 — Office Floor 2"
    );
  });

  it("renders the error message and wires aria-invalid", () => {
    render(
      <MeterSearchablePicker
        value=""
        onChange={() => {}}
        options={OPTIONS}
        error="Meter ID is required"
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Meter ID is required"
    );
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
  });

  it("fires onBlur when focus leaves the field", async () => {
    const user = userEvent.setup();
    const onBlur = vi.fn();
    render(
      <MeterSearchablePicker
        value=""
        onChange={() => {}}
        options={OPTIONS}
        onBlur={onBlur}
      />
    );
    await user.click(screen.getByRole("combobox"));
    await user.tab();
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("keyboard-navigates with arrow keys and tracks aria-activedescendant", async () => {
    const user = userEvent.setup();
    render(
      <MeterSearchablePicker
        value=""
        onChange={() => {}}
        options={OPTIONS}
      />
    );
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{ArrowDown}{ArrowDown}");
    // aria-activedescendant lives on the combobox input, pointing at the
    // active option's id.
    const active = input.getAttribute("aria-activedescendant");
    expect(active).toBeTruthy();
  });
});
