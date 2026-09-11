"use client";

import { useEffect, useState } from "react";

/**
 * Returns `value` only after it has stayed unchanged for `delayMs`.
 *
 * DataTable search and any future filter inputs need to avoid firing an
 * expensive filter/sort (or eventually an API request) on every keystroke.
 * React's state updates are batched but not time-delayed, so a hook is the
 * only way to express "settle before reacting".
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
