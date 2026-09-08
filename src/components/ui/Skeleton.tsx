// ============================================================================
// Skeleton — loading placeholder primitive
// ============================================================================
// Pages currently render nothing or static shells while data loads. This
// primitive gives loading states the shimmer treatment consistently.

export interface SkeletonProps {
  /** Width utility class, e.g. "w-32" or "w-full" */
  className?: string;
  /** Renders a circle instead of a rounded rectangle (avatars, dots) */
  circle?: boolean;
}

/**
 * Decorative by default (aria-hidden); wrap a group of skeletons in an
 * element with aria-busy or provide an sr-only "Loading..." label.
 */
export function Skeleton({ className = "w-full", circle = false }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-surface-tertiary ${
        circle ? "rounded-full" : "rounded-md"
      } h-4 ${className}`}
    />
  );
}

/** Standard skeleton layout for a page section: title row + content rows. */
export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5" aria-busy="true">
      <Skeleton className="w-1/3 mb-4" />
      <Skeleton className="w-1/2 mb-2" />
      <Skeleton className="w-full" />
    </div>
  );
}
