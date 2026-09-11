"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseCopyToClipboardResult {
  /** True while the most recent copy is still in its "copied" window. */
  copied: boolean;
  /** Most recent copied value, or null. */
  copiedValue: string | null;
  /** Attempts a copy; resolves to true when it succeeded. */
  copy: (value: string) => Promise<boolean>;
  error: Error | null;
}

/**
 * Copies text with a resettable "copied" flag for button feedback.
 *
 * The OfflineBanner and address displays previously had no copy affordance
 * at all, and any ad-hoc implementation would need the same fallback dance
 * (async clipboard API is unavailable on insecure origins and older Safari,
 * where document.execCommand is the only option).
 */
export function useCopyToClipboard(resetMs = 2000): UseCopyToClipboardResult {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copy = useCallback(
    async (value: string): Promise<boolean> => {
      let success = false;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(value);
          success = true;
        } else {
          // Legacy fallback for insecure origins / older browsers.
          const textarea = document.createElement("textarea");
          textarea.value = value;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          success = document.execCommand("copy");
          textarea.remove();
        }
        if (success) {
          setCopiedValue(value);
          setError(null);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopiedValue(null), resetMs);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
      return success;
    },
    [resetMs]
  );

  return { copied: copiedValue !== null, copiedValue, copy, error };
}
