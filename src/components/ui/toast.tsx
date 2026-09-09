"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from "lucide-react";

// ============================================================================
// Toast — global notification system
// ============================================================================
// The app previously had no way to surface success/error feedback (the
// offline banner was a special-cased one-off). This provides a context
// provider, a useToast() hook, and an accessible viewport with auto-
// dismiss and pause-on-hover.

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Duration in ms; defaults to 5000 (errors stick to 8000) */
  duration?: number;
  /** Renders a dismiss button and disables auto-dismiss when true */
  persistent?: boolean;
}

interface ToastItem extends Required<Omit<ToastOptions, "duration" | "description">> {
  id: number;
  description?: string;
  duration: number;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}

const VARIANT_STYLES: Record<
  ToastVariant,
  { icon: typeof Info; bar: string; iconColor: string }
> = {
  success: { icon: CheckCircle2, bar: "bg-success", iconColor: "text-success" },
  error: { icon: XCircle, bar: "bg-error", iconColor: "text-error" },
  warning: { icon: AlertTriangle, bar: "bg-warning", iconColor: "text-warning" },
  info: { icon: Info, bar: "bg-info", iconColor: "text-info" },
};

const DEFAULT_DURATIONS: Record<ToastVariant, number> = {
  success: 5000,
  info: 5000,
  warning: 6000,
  error: 8000,
};

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pausedIds, setPausedIds] = useState<Set<number>>(new Set());
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (options: ToastOptions): number => {
      const id = nextId++;
      const variant = options.variant ?? "info";
      const item: ToastItem = {
        id,
        title: options.title,
        description: options.description,
        variant,
        persistent: options.persistent ?? false,
        duration: options.duration ?? DEFAULT_DURATIONS[variant],
      };
      setToasts((prev) => [...prev.slice(-4), item]); // cap at 5 visible
      return id;
    },
    []
  );

  // Auto-dismiss timers, skipped for persistent or paused toasts. Pausing
  // must also clear any already-scheduled timer, otherwise the pause had no
  // effect and hovering over a toast did not stop its dismissal.
  useEffect(() => {
    for (const t of toasts) {
      const existing = timers.current.get(t.id);
      if (t.persistent || pausedIds.has(t.id)) {
        if (existing) {
          clearTimeout(existing);
          timers.current.delete(t.id);
        }
        continue;
      }
      if (!existing) {
        timers.current.set(
          t.id,
          setTimeout(() => dismiss(t.id), t.duration)
        );
      }
    }
  }, [toasts, pausedIds, dismiss]);

  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const timer of map.values()) clearTimeout(timer);
      map.clear();
    };
  }, []);

  const pause = useCallback((id: number) => {
    setPausedIds((prev) => new Set(prev).add(id));
  }, []);

  const resume = useCallback((id: number) => {
    setPausedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Viewport */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-full max-w-sm pointer-events-none"
      >
        {toasts.map((t) => {
          const { icon: Icon, bar, iconColor } = VARIANT_STYLES[t.variant];
          return (
            <div
              key={t.id}
              role={t.variant === "error" ? "alert" : "status"}
              onMouseEnter={() => pause(t.id)}
              onMouseLeave={() => resume(t.id)}
              className="pointer-events-auto relative overflow-hidden rounded-lg border border-border bg-surface shadow-lg p-4 pr-10 animate-[toast-in_200ms_ease-out]"
            >
              <span className={`absolute left-0 top-0 bottom-0 w-1 ${bar}`} aria-hidden="true" />
              <div className="flex items-start gap-3">
                <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconColor}`} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">{t.title}</p>
                  {t.description && (
                    <p className="text-sm text-text-secondary mt-0.5">{t.description}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="absolute top-2 right-2 p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
