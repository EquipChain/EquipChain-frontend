"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme, type Theme } from "./ThemeProvider";
import { SegmentedControl } from "@/src/components/ui/SegmentedControl";

// ============================================================================
// ThemeToggle — segmented light/dark/system switch for the header
// ============================================================================
// Previously hand-rolled its own radiogroup markup; now a thin wrapper
// over the shared SegmentedControl primitive (same a11y semantics, less
// bespoke code).

const OPTIONS: {
  value: Theme;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "light", label: "Light theme", icon: <Sun className="h-4 w-4" aria-hidden="true" /> },
  { value: "dark", label: "Dark theme", icon: <Moon className="h-4 w-4" aria-hidden="true" /> },
  { value: "system", label: "Match system theme", icon: <Monitor className="h-4 w-4" aria-hidden="true" /> },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <SegmentedControl
      ariaLabel="Color theme"
      options={OPTIONS}
      value={theme}
      onChange={setTheme}
      iconOnly
    />
  );
}
