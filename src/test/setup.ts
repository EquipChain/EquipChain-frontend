import "@testing-library/jest-dom/vitest";

import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Run cleanup after each test case (e.g. clearing jsdom and unmounting)
afterEach(() => {
  cleanup();
});

// jsdom lacks matchMedia; components that read media queries need it
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => {
    const listeners = new Set<(e: MediaQueryListEvent) => void>();
    const mql: MediaQueryList = {
      matches: false,
      media: query,
      onchange: null,
      addEventListener: (_: string, cb: EventListenerOrEventListenerObject) => {
        listeners.add(cb as (e: MediaQueryListEvent) => void);
      },
      removeEventListener: (_: string, cb: EventListenerOrEventListenerObject) => {
        listeners.delete(cb as (e: MediaQueryListEvent) => void);
      },
      addListener: (cb: (e: MediaQueryListEvent) => void) => {
        listeners.add(cb);
      },
      removeListener: (cb: (e: MediaQueryListEvent) => void) => {
        listeners.delete(cb);
      },
      dispatchEvent: () => false,
    };
    return mql;
  };
}

// jsdom lacks scrollTo
if (typeof window !== "undefined" && typeof window.scrollTo !== "function") {
  window.scrollTo = vi.fn();
}
