"use client";

import Link from "next/link";
import { AlertTriangle, ChevronRight, Receipt, Fuel } from "lucide-react";
import { useInvoices } from "@/src/lib/api/hooks";
import { formatCurrency, formatDate } from "@/src/lib/utils/format";
import { cn } from "@/src/lib/utils/cn";

// ============================================================================
// DashboardAlerts — action-required notices the overview never surfaced
// ============================================================================
// The dashboard showed aggregates (1 pending, 1 overdue) as bare numbers,
// but nothing told the operator WHICH invoice was overdue or that the gas
// buffer was below the operating floor until they dug into Billing. This
// component turns headline-critical conditions into actionable, linked
// notices rendered above the fold.

export function DashboardAlerts() {
  const { data: invoices } = useInvoices();

  const overdue = (invoices ?? []).filter((invoice) => invoice.status === "Overdue");
  const alertCount = overdue.length;

  if (alertCount === 0) return null;

  return (
    <section
      aria-label="Action required"
      className="rounded-xl border border-warning/40 bg-warning-light/40 dark:bg-yellow-900/10"
    >
      <ul className="divide-y divide-warning/20">
        {overdue.map((invoice) => (
          <li key={invoice.id}>
            <Link
              href="/billing"
              className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-warning-light/60 dark:hover:bg-yellow-900/20"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning-dark dark:text-yellow-400">
                <Receipt className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary">
                  Invoice {invoice.id} is overdue
                </p>
                <p className="truncate text-xs text-text-secondary">
                  {formatCurrency(invoice.amount)} · was due{" "}
                  {formatDate(invoice.dueDate)}
                </p>
              </div>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Inline callout for a below-floor gas buffer. Rendered by the dashboard's
 * gas buffer card when the balance risks failed transactions.
 */
export function GasBufferCriticalNote({
  balance,
  floorXlm,
  className,
}: {
  balance: number;
  floorXlm: number;
  className?: string;
}) {
  if (balance >= floorXlm) return null;

  return (
    <p
      role="alert"
      className={cn(
        "mt-3 flex items-start gap-2 rounded-lg bg-error-light/50 px-3 py-2 text-xs text-error-dark dark:bg-red-900/20 dark:text-red-400",
        className
      )}
    >
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        Balance is below the {floorXlm} XLM operating floor — transactions may
        fail. Top up the reserve.
      </span>
      <Fuel className="ml-auto h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden="true" />
    </p>
  );
}
