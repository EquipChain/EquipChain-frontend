import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKeyboardShortcut } from "./useKeyboardShortcut";

function pressKey(
  key: string,
  init: { mod?: boolean; alt?: boolean; shift?: boolean; repeat?: boolean } = {}
) {
  const event = new KeyboardEvent("keydown", {
    key,
    metaKey: init.mod ?? false,
    ctrlKey: init.mod ?? false,
    altKey: init.alt ?? false,
    shiftKey: init.shift ?? false,
    repeat: init.repeat ?? false,
    bubbles: true,
    cancelable: true,
  });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
}

describe("useKeyboardShortcut", () => {
  it("fires for the plain key", () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: "k" }, handler, { allowInInputs: true }));

    pressKey("k");
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("matches keys case-insensitively", () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: "K" }, handler, { allowInInputs: true }));

    pressKey("k");
    expect(handler).toHaveBeenCalledOnce();
  });

  it("requires the mod modifier when specified", () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: "k", mod: true }, handler, { allowInInputs: true }));

    pressKey("k");
    expect(handler).not.toHaveBeenCalled();

    pressKey("k", { mod: true });
    expect(handler).toHaveBeenCalledOnce();
  });

  it("does not fire when an unrequested modifier is held", () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: "k" }, handler, { allowInInputs: true }));

    pressKey("k", { mod: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it("supports the ? key produced with Shift", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcut({ key: "?", shift: true }, handler, { allowInInputs: true })
    );

    pressKey("?", { shift: true });
    expect(handler).toHaveBeenCalledOnce();
  });

  it("skips events from typing contexts by default", () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: "k" }, handler));

    const input = document.createElement("input");
    document.body.appendChild(input);
    act(() => {
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "k", bubbles: true })
      );
    });
    expect(handler).not.toHaveBeenCalled();

    // Allow-listing typing contexts lets it through.
    input.remove();
  });

  it("ignores auto-repeat by default", () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: "k" }, handler, { allowInInputs: true }));

    pressKey("k", { repeat: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it("can be disabled and re-enabled", () => {
    const handler = vi.fn();
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useKeyboardShortcut({ key: "k" }, handler, { enabled, allowInInputs: true }),
      { initialProps: { enabled: false } }
    );

    pressKey("k");
    expect(handler).not.toHaveBeenCalled();

    rerender({ enabled: true });
    pressKey("k");
    expect(handler).toHaveBeenCalledOnce();
  });

  it("always calls the latest handler", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      ({ fn }: { fn: (e: KeyboardEvent) => void }) =>
        useKeyboardShortcut({ key: "k" }, fn, { allowInInputs: true }),
      { initialProps: { fn: first } }
    );

    rerender({ fn: second });
    pressKey("k");
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it("prevents the default browser action on match", () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: "k", mod: true }, handler, { allowInInputs: true }));

    const event = pressKey("k", { mod: true });
    expect(event.defaultPrevented).toBe(true);
  });
});
