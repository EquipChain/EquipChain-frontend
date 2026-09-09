"use client";

import { useEffect } from "react";

// ============================================================================
// Global Error Boundary (last resort)
// ============================================================================
// app/error.tsx catches errors inside the page tree, but if the root layout
// itself throws (fonts fail, provider crashes, CSS is broken), that boundary
// never mounts. global-error.tsx replaces <html> and <body> and is the only
// thing standing between the user and a raw browser error page.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error.digest ?? "", error.message);
  }, [error]);

  // Deliberately inline-styled: this component renders WITHOUT the root
  // layout, so Tailwind and the design tokens may not be available.
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          background: "#ffffff",
          color: "#0f172a",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.25rem",
          padding: "1.5rem",
          textAlign: "center",
          margin: 0,
        }}
      >
        <div
          role="alert"
          style={{
            maxWidth: "28rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
            EquipChain hit a critical error
          </h1>
          <p style={{ color: "#475569", fontSize: "0.875rem", margin: 0 }}>
            The application failed to start. This is usually temporary —
            reloading the page or clearing site data resolves most cases.
          </p>
          {error.digest && (
            <p style={{ color: "#94a3b8", fontSize: "0.75rem", margin: 0 }}>
              Error reference: <code>{error.digest}</code>
            </p>
          )}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "none",
                background: "#2563eb",
                color: "#ffffff",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Reload
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  window.localStorage.clear();
                  window.sessionStorage.clear();
                } catch {
                  // Storage can be blocked (private mode); proceed anyway
                }
                window.location.href = "/";
              }}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                color: "#475569",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Clear site data & restart
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
