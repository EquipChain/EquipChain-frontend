import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIdleDetection } from "./useIdleDetection";

describe("useIdleDetection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("starts active and stays active within the timeout window", () => {
    const { result } = renderHook(() => useIdleDetection({ timeoutMs: 1000 }));

    expect(result.current.isIdle).toBe(false);

    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(result.current.isIdle).toBe(false);
  });

  it("becomes idle after the timeout without activity", () => {
    const { result } = renderHook(() => useIdleDetection({ timeoutMs: 1000 }));

    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(result.current.isIdle).toBe(true);
  });

  it("resets to active on a user activity event", () => {
    const { result } = renderHook(() => useIdleDetection({ timeoutMs: 1000 }));

    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(result.current.isIdle).toBe(true);

    act(() => {
      window.dispatchEvent(new Event("keydown"));
    });
    expect(result.current.isIdle).toBe(false);
  });

  it("does not go idle while activity keeps arriving", () => {
    const { result } = renderHook(() => useIdleDetection({ timeoutMs: 1000 }));

    for (let i = 0; i < 10; i++) {
      act(() => {
        window.dispatchEvent(new Event("mousedown"));
        vi.advanceTimersByTime(500);
      });
    }
    expect(result.current.isIdle).toBe(false);
  });

  it("updates lastActiveAt on activity", () => {
    const { result } = renderHook(() => useIdleDetection({ timeoutMs: 1000 }));
    const before = result.current.lastActiveAt;

    act(() => {
      vi.advanceTimersByTime(500);
      window.dispatchEvent(new Event("wheel"));
    });

    expect(result.current.lastActiveAt).toBeGreaterThan(before);
  });

  it("treats tab re-focus as activity", () => {
    const { result } = renderHook(() => useIdleDetection({ timeoutMs: 1000 }));

    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(result.current.isIdle).toBe(true);

    // jsdom reports "visible" by default; the visibilitychange handler
    // treats becoming visible as engagement.
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(result.current.isIdle).toBe(false);
  });

  it("cleans up listeners on unmount without errors", () => {
    const { unmount } = renderHook(() => useIdleDetection({ timeoutMs: 1000 }));
    expect(() => unmount()).not.toThrow();

    // No post-unmount state updates when the timer would have fired.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
  });
});
