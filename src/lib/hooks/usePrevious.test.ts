import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePrevious } from "./usePrevious";

describe("usePrevious", () => {
  it("returns the initial value on first render", () => {
    const { result } = renderHook(() => usePrevious(42, 0));
    expect(result.current).toBe(0);
  });

  it("returns undefined on first render when no initial value given", () => {
    const { result } = renderHook(() => usePrevious("a"));
    expect(result.current).toBeUndefined();
  });

  it("returns the previous value after a re-render", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: number }) => usePrevious(value),
      { initialProps: { value: 1 } }
    );

    rerender({ value: 2 });
    expect(result.current).toBe(1);

    rerender({ value: 3 });
    expect(result.current).toBe(2);
  });

  it("keeps the previous value when a re-render passes the same value", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => usePrevious(value),
      { initialProps: { value: "x" } }
    );

    rerender({ value: "x" });
    expect(result.current).toBe("x");
  });

  it("works with object values by reference", () => {
    const first = { reading: 100 };
    const second = { reading: 200 };

    const { result, rerender } = renderHook(
      ({ value }: { value: { reading: number } }) => usePrevious(value),
      { initialProps: { value: first } }
    );

    rerender({ value: second });
    expect(result.current).toBe(first);
  });
});
