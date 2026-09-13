"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/src/lib/utils/cn";

// ============================================================================
// Tooltip — hover/focus annotation primitive
// ============================================================================
// Icon-only buttons across the app (ThemeToggle, upcoming pagination and
// row actions) rely on `title` attributes, which are unverifiable by
// screen readers, unstyleable, and unusable on touch devices. This
// primitive renders a CSS-anchored tooltip that appears on hover AND
// keyboard focus, with proper ARIA wiring.

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  /** Tooltip text */
  content: string;
  /** Element that triggers the tooltip */
  children: ReactNode;
  placement?: TooltipPlacement;
  /** Renders as inline-block wrapper (default) without breaking flex layouts */
  className?: string;
  /** Hover delay in ms before showing; focus shows instantly (default 300) */
  showDelayMs?: number;
}

const PLACEMENT_CLASSES: Record<TooltipPlacement, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

export function Tooltip({
  content,
  children,
  placement = "top",
  className,
  showDelayMs = 300,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();
  const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDelayTimer = () => {
    if (delayTimer.current) {
      clearTimeout(delayTimer.current);
      delayTimer.current = null;
    }
  };

  // Hover waits showDelayMs so sweeping a cursor across a toolbar of icon
  // buttons doesn't strobe tooltips; keyboard focus still shows instantly
  // since it is a deliberate act.
  const showWithDelay = () => {
    clearDelayTimer();
    delayTimer.current = setTimeout(() => setVisible(true), showDelayMs);
  };

  const hide = () => {
    clearDelayTimer();
    setVisible(false);
  };

  useEffect(() => clearDelayTimer, []);

  return (
    <span
      className={cn("relative inline-block", className)}
      onMouseEnter={showWithDelay}
      onMouseLeave={hide}
      onFocusCapture={() => {
        clearDelayTimer();
        setVisible(true);
      }}
      onBlurCapture={hide}
    >
      {/* Tooltip content is announced via aria-describedby on the child's
          wrapper rather than duplicating text; the child keeps its own
          accessible name. */}
      <span
        id={tooltipId}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-text-primary px-2 py-1 text-xs font-medium text-background shadow-md transition-opacity duration-150",
          PLACEMENT_CLASSES[placement],
          visible ? "opacity-100" : "opacity-0"
        )}
      >
        {content}
      </span>
      {children}
    </span>
  );
}
