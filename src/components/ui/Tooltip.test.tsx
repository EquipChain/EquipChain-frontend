import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Tooltip } from "./Tooltip";
import { Button } from "./Button";

describe("Tooltip", () => {
  it("renders trigger and hidden tooltip content", () => {
    render(
      <Tooltip content="Copy address">
        <Button>Copy</Button>
      </Tooltip>
    );
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("Copy address");
    expect(tooltip.className).toContain("opacity-0");
  });

  it("shows after the hover delay", () => {
    vi.useFakeTimers();
    render(
      <Tooltip content="Copy address">
        <Button>Copy</Button>
      </Tooltip>
    );
    const wrapper = screen.getByRole("tooltip").parentElement!;
    fireEvent.mouseEnter(wrapper);
    expect(screen.getByRole("tooltip").className).toContain("opacity-0");

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByRole("tooltip").className).toContain("opacity-100");
    vi.useRealTimers();
  });

  it("supports a custom show delay", () => {
    vi.useFakeTimers();
    render(
      <Tooltip content="Copy address" showDelayMs={50}>
        <Button>Copy</Button>
      </Tooltip>
    );
    const wrapper = screen.getByRole("tooltip").parentElement!;
    fireEvent.mouseEnter(wrapper);
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(screen.getByRole("tooltip").className).toContain("opacity-100");
    vi.useRealTimers();
  });

  it("cancels a pending show when the cursor leaves before the delay", () => {
    vi.useFakeTimers();
    render(
      <Tooltip content="Copy address">
        <Button>Copy</Button>
      </Tooltip>
    );
    const wrapper = screen.getByRole("tooltip").parentElement!;
    fireEvent.mouseEnter(wrapper);
    fireEvent.mouseLeave(wrapper);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByRole("tooltip").className).toContain("opacity-0");
    vi.useRealTimers();
  });

  it("hides again on mouse leave", () => {
    vi.useFakeTimers();
    render(
      <Tooltip content="Copy address">
        <Button>Copy</Button>
      </Tooltip>
    );
    const wrapper = screen.getByRole("tooltip").parentElement!;
    fireEvent.mouseEnter(wrapper);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    fireEvent.mouseLeave(wrapper);
    expect(screen.getByRole("tooltip").className).toContain("opacity-0");
    vi.useRealTimers();
  });

  it("becomes visible when the trigger receives keyboard focus", () => {
    render(
      <Tooltip content="Copy address">
        <Button>Copy</Button>
      </Tooltip>
    );
    fireEvent.focus(screen.getByRole("button", { name: "Copy" }));
    expect(screen.getByRole("tooltip").className).toContain("opacity-100");
  });

  it("supports all placements", () => {
    for (const placement of ["top", "bottom", "left", "right"] as const) {
      const { container, unmount } = render(
        <Tooltip content="info" placement={placement}>
          <span>trigger</span>
        </Tooltip>
      );
      expect(container.firstChild).toBeInTheDocument();
      unmount();
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});
