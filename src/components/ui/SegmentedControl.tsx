"use client";

import { useId } from "react";
import { cn } from "@/src/lib/utils/cn";

// ============================================================================
// SegmentedControl — compact exclusive option switcher
// ============================================================================
// ThemeToggle hand-rolls this pattern with role="radiogroup" and icon-only
// buttons; date-range pickers and table density toggles need the same
// control with visible labels. Extracted and generalized so every
// exclusive-choice surface is consistent and keyboard-correct.

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  /** Accessible name describing the choice */
  ariaLabel: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Renders icons instead of text when all options have icons */
  iconOnly?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function SegmentedControl<T extends string>({
  ariaLabel,
  options,
  value,
  onChange,
  iconOnly = false,
  size = "md",
  className,
}: SegmentedControlProps<T>) {
  const baseId = useId();

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center rounded-lg border border-border bg-surface-secondary p-0.5",
        className
      )}
    >
      {options.map(({ value: optionValue, label, icon }) => {
        const active = optionValue === value;
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            id={`${baseId}-${optionValue}`}
            aria-checked={active}
            aria-label={iconOnly ? label : undefined}
            title={iconOnly ? label : undefined}
            onClick={() => onChange(optionValue)}
            className={cn(
              "rounded-md font-medium transition-colors",
              size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
              iconOnly && "p-1.5",
              active
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            {icon}
            {!iconOnly && label}
          </button>
        );
      })}
    </div>
  );
}
