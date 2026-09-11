import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCopyToClipboard } from "./useCopyToClipboard";
import { useDebouncedValue } from "./useDebouncedValue";

// ---------------------------------------------------------------------------
// useCopyToClipboard
// ---------------------------------------------------------------------------

describe("useCopyToClipboard", () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText },
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("copies via the async clipboard API and sets copied", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    let success = false;
    await act(async () => {
      success = await result.current.copy("hello");
    });

    expect(success).toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello");
    expect(result.current.copied).toBe(true);
    expect(result.current.copiedValue).toBe("hello");
  });

  it("resets the copied flag after the reset window", async () => {
    const { result } = renderHook(() => useCopyToClipboard(1000));

    await act(async () => {
      await result.current.copy("hello");
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1001);
    });
    expect(result.current.copied).toBe(false);
  });

  it("reports an error when the clipboard write rejects", async () => {
    writeText.mockRejectedValueOnce(new Error("denied"));
    const { result } = renderHook(() => useCopyToClipboard());

    let success = true;
    await act(async () => {
      success = await result.current.copy("hello");
    });

    expect(success).toBe(false);
    expect(result.current.copied).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

// ---------------------------------------------------------------------------
// useDebouncedValue
// ---------------------------------------------------------------------------

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("a", 200));
    expect(result.current).toBe("a");
  });

  it("delays propagating updated values", async () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 200),
      { initialProps: { value: "a" } }
    );

    rerender({ value: "ab" });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe("ab");
  });

  it("only propagates the last value in a burst of keystrokes", async () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 200),
      { initialProps: { value: "" } }
    );

    for (const char of ["m", "me", "met", "mete", "meter"]) {
      rerender({ value: char });
      act(() => {
        vi.advanceTimersByTime(50);
      });
    }
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe("meter");
  });
});
