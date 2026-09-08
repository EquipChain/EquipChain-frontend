"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

// ============================================================================
// Button — foundational UI primitive
// ============================================================================
// Centralizes the button styling that was previously duplicated inline across
// every page (ExportButton, billing's View Invoice, offline page, ...), so
// focus rings, disabled states, and hover treatments stay consistent.

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style of the button */
  variant?: ButtonVariant;
  /** Size preset controlling padding and text size */
  size?: ButtonSize;
  /** Shows a spinner and disables interaction */
  loading?: boolean;
  /** Renders as a full-width block button */
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm",
  secondary:
    "bg-surface-secondary text-text-secondary hover:text-text-primary hover:bg-surface-tertiary border border-border",
  outline:
    "bg-transparent text-text-secondary hover:text-brand-600 hover:border-brand-300 border border-border",
  ghost:
    "bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-tertiary",
  danger:
    "bg-error text-white hover:bg-error-dark active:opacity-90 shadow-sm",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      className = "",
      children,
      type = "button",
      ...rest
    },
    ref
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none ${
          variantClasses[variant]
        } ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
        {...rest}
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {children}
      </button>
    );
  }
);
