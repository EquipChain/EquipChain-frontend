import { Loader2 } from "lucide-react";

// ============================================================================
// Spinner — accessible loading indicator
// ============================================================================
// The ExportDialog inlined its own spinning SVG; this standardizes the
// indicator and announces loading to screen readers when standalone.

export type SpinnerSize = "sm" | "md" | "lg";

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export interface SpinnerProps {
  size?: SpinnerSize;
  /** Accessible label announced to screen readers */
  label?: string;
  className?: string;
}

export function Spinner({ size = "md", label = "Loading", className = "" }: SpinnerProps) {
  return (
    <span role="status" className={`inline-flex items-center gap-2 ${className}`}>
      <Loader2
        className={`animate-spin text-text-muted ${sizeClasses[size]}`}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
