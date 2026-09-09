import Link from "next/link";
import { FileQuestion, LayoutDashboard, Gauge, Receipt, Radio } from "lucide-react";

// ============================================================================
// Custom 404 — branded not-found page with real navigation
// ============================================================================
// Without this file, unknown URLs render Next's unstyled default 404. The
// app has exactly four destinations users could have meant, so we list them
// directly instead of dead-ending the visit.

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meters", label: "Meters", icon: Gauge },
  { href: "/billing", label: "Billing", icon: Receipt },
  { href: "/streams", label: "Streams", icon: Radio },
];

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="rounded-full bg-surface-tertiary p-4">
        <FileQuestion className="h-8 w-8 text-text-muted" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-text-primary">
          Page not found
        </h1>
        <p className="max-w-md text-sm text-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved. Try one of the main sections instead.
        </p>
      </div>
      <nav aria-label="Main sections" className="flex flex-wrap items-center justify-center gap-3">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
