"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { ExportDialog } from "./ExportDialog";

// ============================================================================
// Types
// ============================================================================

type ExportDataType = "meters" | "streams" | "billing" | "transactions";

interface ColumnOption {
  key: string;
  label: string;
  enabled: boolean;
}

interface ExportButtonProps {
  /** The title of the data to export (e.g., "Meters", "Billing History") */
  title: string;
  /** The type of data being exported */
  dataType: ExportDataType;
  /** Available columns for the data */
  columns: ColumnOption[];
  /** The data to export */
  data: Record<string, unknown>[];
  /** Optional custom button label */
  label?: string;
  /** Optional variant */
  variant?: "primary" | "secondary" | "outline";
  /** Optional custom class name */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function ExportButton({
  title,
  dataType,
  columns,
  data,
  label = "Export",
  variant = "secondary",
  className = "",
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const variantClasses = {
    primary:
      "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800",
    secondary:
      "bg-surface-secondary text-text-secondary hover:text-text-primary hover:bg-surface-tertiary border border-border",
    outline:
      "bg-transparent text-text-secondary hover:text-brand-600 hover:border-brand-300 border border-border",
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={data.length === 0}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
        aria-label={`Export ${title}`}
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        {label}
        {data.length > 0 && (
          <span className="text-xs opacity-60">({data.length.toLocaleString()})</span>
        )}
      </button>

      <ExportDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        columns={columns}
        data={data}
        title={title}
        dataType={dataType}
      />
    </>
  );
}
