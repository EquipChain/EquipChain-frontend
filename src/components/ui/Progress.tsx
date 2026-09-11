import { cn } from "@/src/lib/utils/cn";

// ============================================================================
// Progress — linear progress indicator
// ============================================================================
// Determinate mode communicates quotas and buffer levels (gas buffer health,
// storage usage); indeterminate mode covers unknown-duration operations that
// currently have no representation at all. Roles and value text follow the
// WAI-ARIA progressbar pattern.

export interface ProgressProps {
  /** Current value between 0 and max */
  value?: number;
  /** Upper bound; defaults to 100 */
  max?: number;
  /** Omits the value and animates an indeterminate bar */
  indeterminate?: boolean;
  /** Visual tone */
  tone?: "brand" | "success" | "warning" | "error";
  /** Shows "n / m" text next to the bar */
  showValue?: boolean;
  /** Accessible label; required so the bar is not anonymous */
  ariaLabel: string;
  className?: string;
}

const TONE_CLASSES = {
  brand: "bg-brand-600",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
} as const;

export function Progress({
  value,
  max = 100,
  indeterminate = false,
  tone = "brand",
  showValue = false,
  ariaLabel,
  className,
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(value ?? 0, max));
  const percent = max > 0 ? (clamped / max) * 100 : 0;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={max}
        {...(!indeterminate && value !== undefined ? { "aria-valuenow": clamped } : {})}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-tertiary"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300",
            TONE_CLASSES[tone],
            indeterminate && "w-1/3 animate-pulse"
          )}
          style={!indeterminate ? { width: `${percent}%` } : undefined}
        />
      </div>
      {showValue && !indeterminate && (
        <span className="shrink-0 text-xs text-text-muted" aria-hidden="true">
          {Number.isInteger(clamped) ? clamped : clamped.toFixed(1)} / {max}
        </span>
      )}
    </div>
  );
}
