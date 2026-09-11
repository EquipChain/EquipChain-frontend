import { PageHeader } from "@/src/components/layout/PageHeader";
import { StatCardSkeleton } from "@/src/components/ui/StatCard";
import { Skeleton } from "@/src/components/ui/Skeleton";

// ============================================================================
// Dashboard loading skeleton
// ============================================================================
// Without a loading.tsx, navigations into a server-rendered route show
// nothing until the whole segment resolves. This mirrors the dashboard
// layout (header + 6 stat cards + chart panel) so the frame is stable
// while data loads.

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
      <PageHeader title="Dashboard" description="Loading overview…" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="rounded-xl border border-border bg-surface p-5">
        <Skeleton className="mb-4 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
