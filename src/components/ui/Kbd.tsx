import { cn } from "@/src/lib/utils/cn";

// ============================================================================
// Kbd — keyboard key hint
// ============================================================================
// The command palette and modal shortcuts need a consistent way to render
// key combinations; raw text like "Press Ctrl+K" reads poorly and cannot
// be styled per-platform. The kbd element is the semantic HTML for this.

export interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-surface-secondary px-1.5 font-sans text-[10px] font-semibold text-text-secondary shadow-sm",
        className
      )}
    >
      {children}
    </kbd>
  );
}
