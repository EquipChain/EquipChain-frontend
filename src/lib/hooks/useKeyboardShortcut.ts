"use client";

import { useEffect, useRef } from "react";

// ============================================================================
// useKeyboardShortcut — declarative global keybindings
// ============================================================================
// Keyboard handling was scattered across bespoke listeners (command palette,
// shortcuts dialog), each hand-rolling modifier checks, input-field guards,
// and repeat suppression. This hook centralizes the matching so a shortcut
// is one declarative line, and the guards that keep shortcuts from firing
// while a user types are shared rather than re-derived (or forgotten).

export interface ShortcutCombo {
  /** Primary key, matched case-insensitively (e.g. "k", "Escape", "?") */
  key: string;
  /** Require Cmd (Mac) or Ctrl (other platforms) */
  mod?: boolean;
  alt?: boolean;
  shift?: boolean;
}

export interface KeyboardShortcutOptions {
  /** Skip the event when focus sits in an input/textarea/select/contenteditable (default true) */
  allowInInputs?: boolean;
  /** Ignore auto-repeat keydown events (default true) */
  ignoreRepeat?: boolean;
  /** Fire on keydown (default) instead of keyup */
  onKeyUp?: boolean;
  /** Disable the binding entirely (e.g. while a dialog owns the keyboard) */
  enabled?: boolean;
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable
  );
}

function matchesCombo(event: KeyboardEvent, combo: ShortcutCombo): boolean {
  const modPressed = event.metaKey || event.ctrlKey;
  if ((combo.mod ?? false) !== modPressed) return false;
  if ((combo.alt ?? false) !== event.altKey) return false;
  // "?" is produced with Shift on most layouts; an explicit shift:true
  // accepts it, otherwise Shift must not be involved.
  if ((combo.shift ?? false) !== event.shiftKey) return false;
  return event.key.toLowerCase() === combo.key.toLowerCase();
}

/**
 * Binds a global keyboard shortcut.
 *
 * @param combo key combination to match
 * @param handler invoked on match
 * @param options guards and lifecycle controls
 */
export function useKeyboardShortcut(
  combo: ShortcutCombo,
  handler: (event: KeyboardEvent) => void,
  options: KeyboardShortcutOptions = {}
): void {
  const {
    allowInInputs = false,
    ignoreRepeat = true,
    onKeyUp = false,
    enabled = true,
  } = options;

  // Latest-handler ref keeps the subscription stable across renders.
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  const comboKey = `${combo.mod ? "mod+" : ""}${combo.alt ? "alt+" : ""}${
    combo.shift ? "shift+" : ""
  }${combo.key.toLowerCase()}`;

  useEffect(() => {
    if (!enabled) return;

    const handle = (event: KeyboardEvent) => {
      if (ignoreRepeat && event.repeat) return;
      if (!allowInInputs && isTypingTarget(event.target)) return;
      if (matchesCombo(event, combo)) {
        event.preventDefault();
        handlerRef.current(event);
      }
    };

    const eventType = onKeyUp ? "keyup" : "keydown";
    window.addEventListener(eventType, handle);
    return () => window.removeEventListener(eventType, handle);
    // comboKey encodes the combo; keeps the effect dep list honest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comboKey, allowInInputs, ignoreRepeat, onKeyUp, enabled]);
}
