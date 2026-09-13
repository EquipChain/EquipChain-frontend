import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

// ============================================================================
// EmptyState — branded zero-data placeholder
// ============================================================================
// Pages previously rendered bare "no data" strings (or nothing at all) when
// a collection was empty, giving users no hint whether that was expected or
// a failure. This primitive pairs an icon + title + hint + optional action
// so every empty surface explains itself and offers a next step.

export type EmptyStateVisual = "icon" | "illustration";

export interface EmptyStateProps {
  /** Primary explanation, e.g. "No meters registered yet" */
  title: string;
  /** Secondary hint explaining what to do next */
  description?: string;
  /** Optional call-to-action (usually a Button or Link) */
  action?: ReactNode;
  /** Icon to display; defaults to a generic inbox icon */
  icon?: ReactNode;
  /** "icon" (default) renders the compact icon chip; "illustration" a
   *  larger framed visual for page-level emptiness */
  visual?: EmptyStateVisual;
  /** Hides the border and background for embedding inside cards */
  bare?: boolean;
}

/** Decorative framed illustration for page-level empty states. */
function IllustrationFrame({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-24 w-24 items-center justify-center"
    >
      {/* Concentric brand-tinted rings give the compact icon a calmer,
          deliberate presence on page-level empty states. */}
      <span className="absolute inset-0 rounded-full bg-brand-50 dark:bg-brand-900/20" />
      <span className="absolute inset-3 rounded-full bg-brand-100/70 dark:bg-brand-900/40" />
      <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-surface shadow-sm">
        {children}
      </span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  visual = "icon",
  bare = false,
}: EmptyStateProps) {
  const Chip = (
    <div className="rounded-full bg-surface-tertiary p-3" aria-hidden="true">
      {icon ?? <Inbox className="h-6 w-6 text-text-muted" />}
    </div>
  );

  const Visual = visual === "illustration"
    ? <IllustrationFrame>{icon ?? <Inbox className="h-6 w-6 text-brand-600 dark:text-brand-400" />}</IllustrationFrame>
    : Chip;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 px-6 text-center ${
        bare ? "py-10" : "rounded-xl border border-dashed border-border bg-surface py-16"
      }`}
    >
      {Visual}
      <div className="space-y-1">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-xs text-text-muted">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
