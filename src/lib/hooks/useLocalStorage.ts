"use client";

import { useCallback, useSyncExternalStore } from "react";

// ============================================================================
// useLocalStorage — persisted client state with SSR safety
// ============================================================================
// Persisted UI state (table density, collapsed panels, selected tab) was
// impossible without hand-rolling localStorage reads inside effects, and
// each hand-roll risked the same hazards: hydration mismatches from reading
// storage during render, JSON parse crashes on corrupt entries, and quota
// errors in private browsing. This hook centralizes all of it.

const SERVER_SNAPSHOT = null;

/** Module-level store: one listener set shared by every hook instance. */
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

// Storage events fire in OTHER tabs; this keeps instances in this tab in
// sync too when the same key is written from several components.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.storageArea === window.localStorage) emit();
  });
}

/**
 * Snapshot cache. useSyncExternalStore requires getSnapshot to return a
 * referentially stable value between store changes — a fresh JSON.parse per
 * read would loop React forever. Entries key on the raw stored string, so
 * identity holds until the underlying storage actually changes.
 */
const snapshotCache = new Map<string, { raw: string | null; value: unknown }>();

function readSnapshot<T>(key: string): T | null {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    // Storage blocked (private browsing) — behaves like an empty store.
    return null;
  }

  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return cached.value as T | null;

  let value: unknown = null;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      // Corrupt JSON — treat the entry as absent rather than crashing the
      // consuming component.
      value = null;
    }
  }
  snapshotCache.set(key, { raw, value });
  return value as T | null;
}

/** Current value used to resolve functional updates. */
function readValue<T>(key: string, fallback: T): T {
  return readSnapshot<T>(key) ?? fallback;
}

/**
 * Persists a JSON-serializable value to localStorage.
 *
 * Hydration-safe: the server render and the first client render both see
 * `initialValue`; the stored value (if any) is adopted synchronously right
 * after hydration without flashing a mismatch. Writes from any instance
 * re-render every instance bound to the same key.
 *
 * @returns [value, setValue, removeValue]
 *
 * @example
 * const [density, setDensity, clearDensity] = useLocalStorage<"compact" | "normal">(
 *   "equipchain.table-density",
 *   "normal"
 * );
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const subscribe = useCallback((onStoreChange: () => void) => {
    listeners.add(onStoreChange);
    return () => listeners.delete(onStoreChange);
  }, []);

  const getSnapshot = useCallback(() => readSnapshot<T>(key), [key]);

  // Server and pre-hydration renders always see initialValue via the
  // fallback below, so no mismatch can occur.
  const stored = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);

  const value = stored === null ? initialValue : (stored as T);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      try {
        const current = readValue<T>(key, initialValue);
        const resolved =
          typeof next === "function" ? (next as (prev: T) => T)(current) : next;
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // Quota exceeded or storage blocked (private browsing): drop the
        // write instead of surfacing an error for a preference.
      } finally {
        emit();
      }
    },
    [key, initialValue]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Storage blocked — nothing to clean up.
    } finally {
      emit();
    }
  }, [key]);

  return [value, setValue, removeValue];
}
