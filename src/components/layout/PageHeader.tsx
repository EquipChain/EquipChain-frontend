import type { ReactNode } from "react";

// ============================================================================
// PageHeader — consistent page title/description/actions block
// ============================================================================
// Every page previously copy-pasted the same <h1> + <p> + actions block with
// slightly different spacing and text colors. Centralizing it keeps
// typography consistent and gives each page a single place to slot its
// actions (export buttons, toggles, etc.). Server-component friendly.

export interface PageHeaderProps {
  /** Page title rendered as an <h1> */
  title: string;
  /** One-line description under the title */
  description?: string;
  /** Right-aligned action area (buttons, export controls, etc.) */
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-text-secondary sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}
