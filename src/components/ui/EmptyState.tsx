import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

// ============================================================================
// EmptyState — branded zero-data placeholder
// ============================================================================
// Pages previously rendered bare "no data" strings (or nothing at all) when
// a collection was empty, giving users no hint whether that was expected or
// a failure. This primitive pairs an icon + title + hint + optional action
// so every empty surface explains itself and offers a next step.

export interface EmptyStateProps {
  /** Primary explanation, e.g. "No meters registered yet" */
  title: string;
  /** Secondary hint explaining what to do next */
  description?: string;
  /** Optional call-to-action (usually a Button or Link) */
  action?: ReactNode;
  /** Icon to display; defaults to a generic inbox icon */
  icon?: ReactNode;
  /** Hides the border and background for embedding inside cards */
  bare?: boolean;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  bare = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 px-6 text-center ${
        bare ? "py-10" : "rounded-xl border border-dashed border-border bg-surface py-16"
      }`}
    >
      <div className="rounded-full bg-surface-tertiary p-3" aria-hidden="true">
        {icon ?? <Inbox className="h-6 w-6 text-text-muted" />}
      </div>
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
