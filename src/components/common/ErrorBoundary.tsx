"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/src/components/ui/Button";

// ============================================================================
// ErrorBoundary — client-side error containment for widget subtrees
// ============================================================================
// app/error.tsx only catches errors at the route level: one failing widget
// (a chart, an export dialog) unmounts the entire page. This class
// boundary lets pages wrap individual widgets so a failure degrades to a
// placeholder instead of taking down the dashboard. React only supports
// class components for this API.

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Short name shown in the fallback, e.g. "consumption chart" */
  sectionName?: string;
  /** Custom fallback renderer */
  fallback?: (reset: () => void) => ReactNode;
  /** Called on every caught error (e.g. to report to monitoring) */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Route-level boundaries log to console; widget-level boundaries report
    // through the optional callback so pages can wire monitoring later.
    this.props.onError?.(error, errorInfo);
    if (!this.props.onError) {
      console.error(`[widget-error: ${this.props.sectionName ?? "unknown"}]`, error);
    }
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error) {
      if (this.props.fallback) {
        return this.props.fallback(this.reset);
      }
      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-error-light bg-error-light/20 p-8 text-center dark:border-red-900/40 dark:bg-red-900/10"
        >
          <span className="rounded-full bg-error-light p-3 dark:bg-red-900/30">
            <AlertTriangle className="h-5 w-5 text-error" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-text-primary">
              The {this.props.sectionName ?? "section"} failed to load
            </p>
            <p className="text-xs text-text-muted">
              The rest of the page is unaffected.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={this.reset}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
