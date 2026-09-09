"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

// ============================================================================
// Theme — user-controlled light/dark/system with cookie persistence
// ============================================================================
// Dark styling previously keyed exclusively off prefers-color-scheme, so
// users on a dark OS who wanted a light dashboard (or vice versa) had no
// way to override it. The choice persists in a cookie that the root layout
// reads server-side, which means the correct theme is present in the very
// first paint — no flash of the wrong theme, and no layout thrash.

export type Theme = "light" | "dark" | "system";

export const THEME_COOKIE = "equipchain-theme";

export const darkModeMediaQuery = "(prefers-color-scheme: dark)";

export interface ThemeContextValue {
  /** The user's selected preference (may be "system") */
  theme: Theme;
  /** The theme actually applied ("light" or "dark"; resolves "system") */
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a <ThemeProvider>");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// System dark preference as an external store (lint-clean subscription)
// ---------------------------------------------------------------------------

function subscribeToSystemDark(onChange: () => void): () => void {
  const media = window.matchMedia(darkModeMediaQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function useSystemPrefersDark(): boolean {
  return useSyncExternalStore(
    subscribeToSystemDark,
    () => window.matchMedia(darkModeMediaQuery).matches,
    // Server snapshot: unknown during SSR; the CSS media query covers the
    // pre-hydration frame, so "light" here never paints anything.
    () => false
  );
}

// ---------------------------------------------------------------------------

function applyThemeClass(theme: "light" | "dark"): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function ThemeProvider({
  children,
  /** Theme chosen on the server from the cookie (SSR pass) */
  initialTheme = "system",
}: {
  children: ReactNode;
  initialTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const systemDark = useSystemPrefersDark();

  // Pure derived value — no effect, no extra state
  const resolvedTheme: "light" | "dark" =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  // Applying the class is synchronizing an external system (the DOM), which
  // is exactly what effects are for.
  useEffect(() => {
    applyThemeClass(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    // Cookie is read by the root layout on every navigation, so persisting
    // here keeps SSR in sync with the client choice for 1 year.
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
