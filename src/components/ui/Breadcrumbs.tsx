import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

// ============================================================================
// Breadcrumbs — hierarchical location indicator
// ============================================================================
// Detail pages (meter profile) are reachable from tables but give no sense
// of where you are in the hierarchy. The JSON-LD already declares the
// breadcrumb structure for crawlers; this renders the human equivalent.

export interface BreadcrumbItem {
  label: string;
  /** Omit href for the current page (renders as plain text). */
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-text-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.href ?? item.label} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="rounded transition-colors hover:text-text-primary"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className={cn(isLast && "font-medium text-text-primary")}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
