"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

// ============================================================================
// Route Error Boundary
// ============================================================================
// Without this file, any runtime error in a server or client component
// crashes the whole route with Next's generic production error page, and
// the user has no way to recover except a manual URL edit. This boundary
// scopes the failure to the route, explains what happened, and offers
// recovery (retry = re-render the segment; home = known-good route).

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this is where a monitoring service (Sentry, etc.) hooks in.
    // digest lets support correlate the user-visible message with server logs.
    console.error("[route-error]", error.digest ?? "", error.message);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center"
    >
      <div className="rounded-full bg-error-light p-4 dark:bg-red-900/20">
        <AlertTriangle className="h-8 w-8 text-error" aria-hidden="true" />
      </div>
      <div className="max-w-md space-y-2">
        <h1 className="text-2xl font-semibold text-text-primary">
          Something went wrong
        </h1>
        <p className="text-sm text-text-secondary">
          An unexpected error occurred while loading this page. Your data is
          safe — retrying usually resolves the issue.
        </p>
        {error.digest && (
          <p className="text-xs text-text-muted">
            Error reference: <code className="font-mono">{error.digest}</code>
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Go home
        </Link>
      </div>
    </div>
  );
}
