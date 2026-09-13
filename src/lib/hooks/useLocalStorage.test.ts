import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLocalStorage } from "./useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("returns the initial value when nothing is stored", () => {
    const { result } = renderHook(() =>
      useLocalStorage("test-key", "fallback")
    );
    expect(result.current[0]).toBe("fallback");
  });

  it("adopts an already-stored value", () => {
    window.localStorage.setItem("test-key", JSON.stringify("stored"));
    const { result } = renderHook(() =>
      useLocalStorage("test-key", "fallback")
    );
    expect(result.current[0]).toBe("stored");
  });

  it("persists writes as JSON", () => {
    const { result } = renderHook(() =>
      useLocalStorage<{ a: number }>("test-key", { a: 1 })
    );

    act(() => {
      result.current[1]({ a: 42 });
    });

    expect(result.current[0]).toEqual({ a: 42 });
    expect(JSON.parse(window.localStorage.getItem("test-key")!)).toEqual({
      a: 42,
    });
  });

  it("supports functional updates against the current value", () => {
    const { result } = renderHook(() => useLocalStorage("count", 5));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(6);
  });

  it("removes the stored value and falls back to the initial value", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "base"));

    act(() => {
      result.current[1]("temporary");
    });
    expect(result.current[0]).toBe("temporary");

    act(() => {
      result.current[2]();
    });
    expect(result.current[0]).toBe("base");
    expect(window.localStorage.getItem("test-key")).toBeNull();
  });

  it("treats corrupt JSON as absent", () => {
    window.localStorage.setItem("test-key", "{not json");
    const { result } = renderHook(() =>
      useLocalStorage("test-key", "safe")
    );
    expect(result.current[0]).toBe("safe");
  });

  it("keeps two instances bound to the same key in sync", () => {
    const first = renderHook(() => useLocalStorage("shared", 0));
    const second = renderHook(() => useLocalStorage("shared", 0));

    act(() => {
      first.result.current[1](99);
    });

    expect(second.result.current[0]).toBe(99);
  });

  it("keeps instances on different keys independent", () => {
    const first = renderHook(() => useLocalStorage("key-a", "a"));
    const second = renderHook(() => useLocalStorage("key-b", "b"));

    act(() => {
      first.result.current[1]("a2");
    });

    expect(second.result.current[0]).toBe("b");
  });

  it("synchronizes when a storage event arrives from another tab", () => {
    const { result } = renderHook(() => useLocalStorage("cross-tab", "old"));

    act(() => {
      window.localStorage.setItem("cross-tab", JSON.stringify("new"));
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "cross-tab",
          storageArea: window.localStorage,
        })
      );
    });

    expect(result.current[0]).toBe("new");
  });

  it("falls back to the initial value when storage writes throw", () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("quota", "QuotaExceededError");
      });

    const { result } = renderHook(() => useLocalStorage("quota", "kept"));

    act(() => {
      result.current[1]("rejected");
    });

    // The in-memory snapshot re-reads storage, which never changed.
    expect(result.current[0]).toBe("kept");
    setItemSpy.mockRestore();
  });
});
