"use client";

import { useEffect, useRef, useState } from "react";

// ============================================================================
// useIdleDetection — pause background work while the operator is away
// ============================================================================
// Streams and other polling surfaces revalidate on a fixed interval whether
// or not anyone is looking. Overnight this burns requests against the API
// and churns render cycles for a screen nobody watches. This hook reports
// user idleness from real activity signals (pointer, keys, scroll, focus)
// so consumers can gate polling behind engagement.

/** Activity events that count as "the user is here". */
const ACTIVITY_EVENTS = [
  "keydown",
  "mousedown",
  "mousemove",
  "touchstart",
  "wheel",
  "scroll",
] as const;

export interface IdleDetectionOptions {
  /** Milliseconds of inactivity before marking idle (default 60_000) */
  timeoutMs?: number;
}

export interface IdleState {
  /** True once no activity has been seen for the timeout window */
  isIdle: boolean;
  /** Epoch ms of the most recent observed activity */
  lastActiveAt: number;
}

/**
 * Tracks user engagement via DOM activity events. Returns `isIdle` after
 * `timeoutMs` without input, resetting to active on any event or when the
 * tab regains focus. Hydration-safe: starts active, evaluates on mount.
 *
 * @example
 * const { isIdle } = useIdleDetection({ timeoutMs: 120_000 });
 * useSWR("streams", fetcher, { refreshInterval: isIdle ? 0 : 30_000 });
 */
export function useIdleDetection(
  options: IdleDetectionOptions = {}
): IdleState {
  const { timeoutMs = 60_000 } = options;
  const [isIdle, setIsIdle] = useState(false);
  const [lastActiveAt, setLastActiveAt] = useState(() => Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;

    const armTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (mounted) setIsIdle(true);
      }, timeoutMs);
    };

    const handleActivity = () => {
      if (!mounted) return;
      setLastActiveAt(Date.now());
      // setIsIdle(false) only when actually idle — avoids a state churn
      // (and re-render storm) on every mousemove of an active session.
      setIsIdle((prev) => (prev ? false : prev));
      armTimer();
    };

    const handleVisibility = () => {
      // Returning to the tab is engagement; hiding it starts the idle
      // countdown from a clean slate.
      if (document.visibilityState === "visible") {
        handleActivity();
      } else {
        armTimer();
      }
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", handleVisibility);

    armTimer();

    return () => {
      mounted = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [timeoutMs]);

  return { isIdle, lastActiveAt };
}
