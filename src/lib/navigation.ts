import { LayoutDashboard, Gauge, Receipt, Radio, type LucideIcon } from "lucide-react";

// ============================================================================
// Navigation registry — single source of truth for the app's sections
// ============================================================================
// AppShell and not-found.tsx each declare their own parallel
// {href, label, icon} lists. Adding a section means editing both (plus the
// sitemap and any future command palette), and they have already drifted
// once: the 404 page lists sections in a different order than the header.

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** One-line description surfaced in the command palette and 404 page. */
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Overview of meters, usage, and gas buffer status",
  },
  {
    href: "/meters",
    label: "Meters",
    icon: Gauge,
    description: "Browse and manage utility meters",
  },
  {
    href: "/billing",
    label: "Billing",
    icon: Receipt,
    description: "Invoices, payments, and spending history",
  },
  {
    href: "/streams",
    label: "Streams",
    icon: Radio,
    description: "Live meter data feeds and uptime",
  },
];

/** Exact match for the first section, prefix match for nested routes. */
export function isActiveNavPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
