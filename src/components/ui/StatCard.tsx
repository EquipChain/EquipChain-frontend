import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "./Card";
import { Skeleton } from "./Skeleton";
import { cn } from "@/src/lib/utils/cn";

// ============================================================================
// StatCard — KPI summary card
// ============================================================================
// Dashboard cards are currently assembled inline from raw <p> tags plus a
// misused StatusBadge (a *status* component rendering arbitrary strings like
// "+5.3%" or "0"). This primitive gives KPIs a real component with
// trend-aware coloring and an icon, a loading skeleton, and consistent
// typography.

export type StatTrend = "up" | "down" | "stable";

export interface StatCardProps {
  /** Metric label, e.g. "Total Consumption" */
  label: string;
  /** Pre-formatted primary value, e.g. "125,000 kWh" */
  value: ReactNode;
  /** Optional numeric change vs. previous period, e.g. 5.3 */
  change?: number;
  /** Renders change as a percentage sign */
  changeIsPercent?: boolean;
  /** Direction of the change; inferred from sign when omitted */
  trend?: StatTrend;
  /** Optional trailing icon or slot */
  icon?: ReactNode;
  /** Accessible description for screen readers, defaults to label */
  srLabel?: string;
  className?: string;
}

const TREND_STYLES: Record<StatTrend, { className: string; Icon: typeof Minus }> = {
  up: { className: "text-success", Icon: ArrowUpRight },
  down: { className: "text-error", Icon: ArrowDownRight },
  stable: { className: "text-text-muted", Icon: Minus },
};

export function StatCard({
  label,
  value,
  change,
  changeIsPercent = true,
  trend,
  icon,
  srLabel,
  className,
}: StatCardProps) {
  const resolvedTrend: StatTrend =
    trend ?? (change === undefined || change === 0 ? "stable" : change > 0 ? "up" : "down");
  const { className: trendColor, Icon } = TREND_STYLES[resolvedTrend];

  return (
    <Card className={cn("flex flex-col gap-1", className)} aria-label={srLabel ?? label}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-text-muted">{label}</p>
        {icon && <span className="text-text-muted">{icon}</span>}
      </div>
      <p className="text-2xl font-bold tracking-tight text-text-primary">{value}</p>
      {change !== undefined && (
        <p className={cn("mt-0.5 inline-flex items-center gap-1 text-xs font-medium", trendColor)}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {change > 0 ? "+" : ""}
            {change}
            {changeIsPercent ? "%" : ""} vs last period
          </span>
        </p>
      )}
    </Card>
  );
}

/** Loading skeleton matching StatCard's layout. */
export function StatCardSkeleton() {
  return (
    <Card aria-hidden="true">
      <Skeleton className="mb-3 w-1/2" />
      <Skeleton className="mb-1 h-8 w-3/4" />
      <Skeleton className="w-1/3" />
    </Card>
  );
}
