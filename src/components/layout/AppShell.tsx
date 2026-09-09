"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Gauge, Receipt, Radio, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/src/components/theme/ThemeToggle";

// ============================================================================
// AppShell — persistent top navigation for every page
// ============================================================================
// Each page previously stood alone: there was no way to move between
// Dashboard, Meters, Billing and Streams except editing the URL. This shell
// gives every route a shared header, active-section highlighting, a mobile
// drawer, and skip-link/focus handling for accessibility.

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meters", label: "Meters", icon: Gauge },
  { href: "/billing", label: "Billing", icon: Receipt },
  { href: "/streams", label: "Streams", icon: Radio },
] as const;

function isActivePath(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  // Exact match for /dashboard, prefix match for the others so future
  // nested routes (e.g. /meters/[id]) keep their parent highlighted.
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  const closeMenu = () => setMenuOpen(false);

  // Move focus into the drawer when it opens so keyboard users land on the
  // first link. Focus returns to the toggle inside its click handler.
  useEffect(() => {
    if (menuOpen) {
      firstLinkRef.current?.focus();
    }
  }, [menuOpen]);

  const toggleMenu = () => {
    setMenuOpen((open) => {
      if (open) {
        // Drawer is about to close: hand focus back to the toggle button
        menuButtonRef.current?.focus({ preventScroll: true });
      }
      return !open;
    });
  };

  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-text-primary"
            aria-label="EquipChain home"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white"
              aria-hidden="true"
            >
              <Gauge className="h-4 w-4" />
            </span>
            EquipChain
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = isActivePath(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                          : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Theme switcher — hidden on mobile for space; theme still applies */}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          {/* Mobile menu toggle */}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={toggleMenu}
            className="inline-flex items-center justify-center rounded-lg p-2 text-text-secondary hover:bg-surface-secondary hover:text-text-primary md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <nav
            id="mobile-nav"
            aria-label="Main"
            className="border-t border-border bg-surface md:hidden"
          >
            <ul className="space-y-1 px-4 py-3">
              {NAV_ITEMS.map(({ href, label, icon: Icon }, index) => {
                const active = isActivePath(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      ref={index === 0 ? firstLinkRef : undefined}
                      aria-current={active ? "page" : undefined}
                      onClick={closeMenu}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                          : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </header>

      <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>

      <footer className="border-t border-border py-6">
        <p className="mx-auto max-w-6xl px-4 text-xs text-text-muted sm:px-6">
          EquipChain — utility metering and billing on Stellar Soroban
        </p>
      </footer>
    </div>
  );
}
