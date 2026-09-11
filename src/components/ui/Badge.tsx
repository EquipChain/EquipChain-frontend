import { type HTMLAttributes } from "react";
import { cn } from "@/src/lib/utils/cn";

// ============================================================================
// Badge / StatusBadge — status indication primitives
// ============================================================================
// Pages previously hand-rolled status pills with repeated conditional class
// strings (meters, billing, streams each had their own ternary). This
// centralizes the palette and semantic mapping in one tested place.

export type BadgeVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const badgeVariantClasses: Record<BadgeVariant, string> = {
  success: "bg-success-light text-success-dark dark:bg-green-900/20 dark:text-green-400",
  warning: "bg-warning-light text-warning-dark dark:bg-yellow-900/20 dark:text-yellow-400",
  error: "bg-error-light text-error-dark dark:bg-red-900/20 dark:text-red-400",
  info: "bg-info-light text-info-dark dark:bg-blue-900/20 dark:text-blue-400",
  neutral: "bg-surface-tertiary text-text-muted",
};

export function Badge({
  variant = "neutral",
  className = "",
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        badgeVariantClasses[variant],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

// ============================================================================
// StatusBadge — maps domain status strings to semantic variants
// ============================================================================

/** Domain statuses that appear across meters, billing, and streams. */
export type DomainStatus =
  | "Active"
  | "Inactive"
  | "Paid"
  | "Pending"
  | "Overdue"
  | "Streaming"
  | "Paused"
  | "Failed"
  | "Offline"
  | (string & {});

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  Active: "success",
  Streaming: "success",
  Paid: "success",
  Online: "success",
  Pending: "warning",
  Paused: "warning",
  Inactive: "neutral",
  Offline: "neutral",
  Overdue: "error",
  Failed: "error",
};

export function StatusBadge({ status, ...rest }: { status: DomainStatus } & Omit<
  BadgeProps,
  "variant" | "children"
>) {
  const variant = STATUS_VARIANTS[status] ?? "neutral";
  return (
    <Badge variant={variant} {...rest}>
      {status}
    </Badge>
  );
}
