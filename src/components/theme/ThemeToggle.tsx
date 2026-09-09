"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme, type Theme } from "./ThemeProvider";

// ============================================================================
// ThemeToggle — segmented light/dark/system switch for the header
// ============================================================================

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light theme", icon: Sun },
  { value: "dark", label: "Dark theme", icon: Moon },
  { value: "system", label: "Match system theme", icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className="flex items-center rounded-lg border border-border bg-surface-secondary p-0.5"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={`rounded-md p-1.5 transition-colors ${
              active
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
