"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

// ============================================================================
// usePrevious — observe a value's last-render value
// ============================================================================
// Comparing "now vs before" (direction arrows on stat deltas, transition
// triggers, scroll restoration) previously required each component to
// hand-roll a ref + effect pair, and the subtle part — writing the ref in
// an effect so it stays consistent under Strict Mode double-renders — was
// easy to get wrong per instance.
//
// The react-hooks/refs rule forbids reading refs during render, so the
// snapshot flows through useSyncExternalStore with a no-op store: the ref
// only advances in an effect (after commit), and every render re-reads the
// snapshot through React's own mechanism. Both client and server snapshots
// are defined, so SSR cannot dehydrate a mismatch.

/**
 * Returns the value from the previous render, or the initial value on the
 * first render.
 *
 * @example
 * const previousReading = usePrevious(meter.lastReading);
 * const direction = previousReading === undefined
 *   ? 0
 *   : meter.lastReading - previousReading;
 */
export function usePrevious<T>(value: T, initialValue?: T): T | undefined {
  const previousRef = useRef<T | undefined>(initialValue);

  const subscribe = useCallback(() => () => {}, []);
  const getSnapshot = useCallback(() => previousRef.current, []);
  const getServerSnapshot = useCallback(() => initialValue, [initialValue]);

  const previous = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  // Advance the pointer only after commit. The render that observes the new
  // `value` still sees the old snapshot, which is exactly "previous".
  useEffect(() => {
    previousRef.current = value;
  }, [value]);

  return previous;
}
