import { type HTMLAttributes, type ReactNode } from "react";

// ============================================================================
// Card — surface container primitive
// ============================================================================
// Dashboard cards were written inline on the dashboard page only; any other
// surface had to re-invent border/radius/hover behavior. This standardizes
// the elevation + padding patterns from the design tokens.

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds the subtle hover border highlight used on clickable cards */
  interactive?: boolean;
  /** Padding size preset */
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
} as const;

export function Card({
  interactive = false,
  padding = "md",
  className = "",
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface shadow-sm ${
        interactive ? "hover:border-brand-300 transition-colors" : ""
      } ${paddingClasses[padding]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned action area (buttons, export, etc.) */
  actions?: ReactNode;
}

export function CardHeader({
  title,
  description,
  actions,
  className = "",
  ...rest
}: CardHeaderProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 ${className}`}
      {...rest}
    >
      <div>
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        {description && (
          <p className="text-sm text-text-muted mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function CardContent({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mt-4 ${className}`} {...rest}>
      {children}
    </div>
  );
}
