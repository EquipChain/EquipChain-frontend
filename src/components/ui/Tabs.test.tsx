import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tabs, TabPanel } from "./Tabs";

function setup(onChange?: (id: string) => void) {
  return render(
    <Tabs
      tabs={[
        { id: "overview", label: "Overview" },
        { id: "readings", label: "Readings" },
        { id: "settings", label: "Settings" },
      ]}
      onChange={onChange}
    >
      <TabPanel id="overview">Overview content</TabPanel>
      <TabPanel id="readings">Readings content</TabPanel>
      <TabPanel id="settings">Settings content</TabPanel>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("renders the first tab selected by default", () => {
    setup();
    const overview = screen.getByRole("tab", { name: "Overview" });
    expect(overview).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Overview content")).toBeInTheDocument();
    expect(screen.queryByText("Readings content")).not.toBeInTheDocument();
  });

  it("switches panels on click and calls onChange", () => {
    const onChange = vi.fn();
    setup(onChange);
    fireEvent.click(screen.getByRole("tab", { name: "Readings" }));
    expect(screen.getByText("Readings content")).toBeInTheDocument();
    expect(screen.queryByText("Overview content")).not.toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith("readings");
  });

  it("moves right with ArrowRight and wraps", () => {
    const onChange = vi.fn();
    setup(onChange);
    const tablist = screen.getByRole("tablist");
    fireEvent.keyDown(tablist, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Readings" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    fireEvent.keyDown(tablist, { key: "ArrowRight" });
    fireEvent.keyDown(tablist, { key: "ArrowRight" });
    // Wrapped back to Overview
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  it("moves left with ArrowLeft", () => {
    setup();
    fireEvent.click(screen.getByRole("tab", { name: "Settings" }));
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowLeft" });
    expect(screen.getByRole("tab", { name: "Readings" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  it("jumps to first/last with Home/End", () => {
    setup();
    const tablist = screen.getByRole("tablist");
    fireEvent.keyDown(tablist, { key: "End" });
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    fireEvent.keyDown(tablist, { key: "Home" });
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  it("respects initialTab", () => {
    render(
      <Tabs tabs={[{ id: "a", label: "A" }, { id: "b", label: "B" }]} initialTab="b">
        <TabPanel id="a">A content</TabPanel>
        <TabPanel id="b">B content</TabPanel>
      </Tabs>
    );
    expect(screen.getByRole("tab", { name: "B" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("B content")).toBeInTheDocument();
  });

  it("wires aria-controls and aria-labelledby", () => {
    setup();
    const tab = screen.getByRole("tab", { name: "Overview" });
    const panel = screen.getByRole("tabpanel", { name: "Overview" });
    expect(tab.getAttribute("aria-controls")).toBe(panel.id);
    expect(panel.getAttribute("aria-labelledby")).toBe(tab.id);
  });
});
