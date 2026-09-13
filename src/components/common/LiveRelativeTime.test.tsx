import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { LiveRelativeTime } from "./LiveRelativeTime";

describe("LiveRelativeTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a formatted relative label inside a time element", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T14:37:00Z"));
    render(<LiveRelativeTime datetime="2026-03-15T14:32:00Z" />);
    const time = screen.getByText(/minutes? ago|just now/i);
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("datetime", "2026-03-15T14:32:00Z");
  });

  it("re-renders the label as time passes without a data refetch", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T14:32:00Z"));
    render(<LiveRelativeTime datetime="2026-03-15T14:32:00Z" tickMs={1000} />);

    expect(screen.getByRole("time").textContent).toMatch(/less than a minute|second/i);

    act(() => {
      vi.advanceTimersByTime(65_000);
    });

    expect(screen.getByRole("time").textContent).toMatch(/minutes? ago/i);
  });

  it("respects the tick interval", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T14:32:00Z"));
    render(<LiveRelativeTime datetime="2026-03-15T14:32:00Z" tickMs={5000} />);

    act(() => {
      vi.advanceTimersByTime(4_999);
    });
    expect(screen.getByRole("time").textContent).toMatch(/less than a minute|second/i);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole("time").textContent).toMatch(/minutes? ago/i);
  });
});
