import { PageHeader } from "@/src/components/layout/PageHeader";
import { Skeleton } from "@/src/components/ui/Skeleton";

// ============================================================================
// Streams loading skeleton — mirrors the stream table layout
// ============================================================================

export default function StreamsLoading() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
      <PageHeader title="Streams" description="Loading streams…" />
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="w-1/4" />
          <Skeleton className="w-40" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="mb-3 h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
