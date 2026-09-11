"use client";

import { useSyncExternalStore } from "react";

/**
 * Subscribes to a CSS media query.
 *
 * Needed by upcoming responsive primitives (mobile drawer behavior,
 * chart breakpoints, DataTable density toggles) that must branch on
 * viewport *behavior* rather than a Tailwind class. The subscription is
 * written with useSyncExternalStore so it is tear-free under concurrent
 * rendering and exposes a server snapshot for SSR — unlike the naive
 * useEffect+setState version, which flashes the wrong value on hydration
 * and re-renders once per media change.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = (onChange: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  };

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    // Server snapshot: assume the common desktop case; hydration will
    // reconcile immediately if the client disagrees.
    () => false
  );
}
