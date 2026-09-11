import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DropdownMenu } from "./DropdownMenu";

const items = [
  { id: "copy", label: "Copy ID", onSelect: vi.fn() },
  { id: "export", label: "Export row", onSelect: vi.fn() },
  { id: "delete", label: "Delete", destructive: true, onSelect: vi.fn() },
];

describe("DropdownMenu", () => {
  it("renders a collapsed trigger with aria-haspopup", () => {
    render(
      <DropdownMenu triggerLabel="Row actions" items={items} />
    );
    const trigger = screen.getByRole("button", { name: "Row actions" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens on click and lists items", () => {
    render(<DropdownMenu triggerLabel="Row actions" items={items} />);
    fireEvent.click(screen.getByRole("button", { name: "Row actions" }));
    const menu = screen.getByRole("menu", { name: "Row actions" });
    expect(menu).toBeInTheDocument();
    for (const item of items) {
      expect(screen.getByRole("menuitem", { name: item.label })).toBeInTheDocument();
    }
  });

  it("invokes onSelect and closes after choosing an item", () => {
    const onSelect = vi.fn();
    render(
      <DropdownMenu
        triggerLabel="Row actions"
        items={[{ id: "copy", label: "Copy ID", onSelect }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Row actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Copy ID" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes on Escape and restores focus to the trigger", () => {
    render(<DropdownMenu triggerLabel="Row actions" items={items} />);
    const trigger = screen.getByRole("button", { name: "Row actions" });
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it("closes on outside pointer down", () => {
    render(
      <div>
        <DropdownMenu triggerLabel="Row actions" items={items} />
        <div data-testid="outside" />
      </div>
    );
    fireEvent.click(screen.getByRole("button", { name: "Row actions" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.pointerDown(screen.getByTestId("outside"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("supports arrow-key navigation between items", () => {
    render(<DropdownMenu triggerLabel="Row actions" items={items} />);
    fireEvent.click(screen.getByRole("button", { name: "Row actions" }));
    const menu = screen.getByRole("menu");
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    // Focus lands on the first menuitem
    expect(document.activeElement).toBe(
      screen.getByRole("menuitem", { name: "Copy ID" })
    );
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(document.activeElement).toBe(
      screen.getByRole("menuitem", { name: "Export row" })
    );
    fireEvent.keyDown(menu, { key: "ArrowUp" });
    expect(document.activeElement).toBe(
      screen.getByRole("menuitem", { name: "Copy ID" })
    );
  });

  it("renders disabled items as unfocusable and unclickable", () => {
    render(
      <DropdownMenu
        triggerLabel="Row actions"
        items={[{ id: "x", label: "Unavailable", disabled: true }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Row actions" }));
    const item = screen.getByRole("menuitem", { name: "Unavailable" });
    expect(item).toBeDisabled();
  });
});
