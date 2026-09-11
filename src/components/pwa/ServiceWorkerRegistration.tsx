"use client";

import { useEffect } from "react";

/**
 * Registers the Serwist service worker exactly once on mount.
 *
 * next.config.ts compiles app/sw.ts into public/sw.js, but nothing ever
 * called navigator.serviceWorker.register — the build output was dead
 * weight and the offline page/manifest were unreachable at runtime.
 * Registration waits for the window load event so it never competes with
 * the initial render for bandwidth, and is skipped in development where
 * the worker's aggressive caching makes HMR confusing.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((error) => {
          console.warn("[pwa] service worker registration failed:", error);
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
