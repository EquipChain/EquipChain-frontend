"use client";

import { useEffect, type RefObject } from "react";

// ============================================================================
// useFocusTrap — Tab-cycling containment for dialogs and overlays
// ============================================================================
// Focus trapping is the part of dialog accessibility that is easiest to get
// subtly wrong (off-by-one wrap edges, shift-tab exits, elements focused
// outside the container entirely). Modal previously carried this logic
// inline, which made the behavior unavailable to other overlay surfaces
// (command palette, drawer) and untestable in isolation. This hook holds the
// selector and the wrap logic in one tested place.

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps Tab (and Shift+Tab) keyboard focus inside `containerRef` while
 * `active` is true. Attach it to any rendered overlay; the hook no-ops when
 * inactive or when the container is not mounted. Escape-to-close stays the
 * caller's responsibility so overlays control their own dismissal policy.
 *
 * @param containerRef ref to the element focus is confined within
 * @param active enables the trap while true
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean
): void {
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const container = containerRef.current;
      if (!container) return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement as HTMLElement | null;

      // Focus outside the container (e.g. the user clicked the page behind
      // an untrapped pointer layer) is pulled back to the first element.
      if (!container.contains(current)) {
        event.preventDefault();
        first.focus();
        return;
      }

      if (event.shiftKey && current === first) {
        // Backwards wrap: first -> last
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        // Forwards wrap: last -> first
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [containerRef, active]);
}
