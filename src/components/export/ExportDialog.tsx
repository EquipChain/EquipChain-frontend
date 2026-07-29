"use client";

import { useState, useCallback } from "react";
import { generateCSV, downloadCSV } from "@/src/lib/export/csv";
import type { CSVColumn } from "@/src/lib/export/csv";
import { generateJSON, downloadJSON } from "@/src/lib/export/json";
import type { JSONExportMetadata } from "@/src/lib/export/json";
import { sanitizeString } from "@/src/lib/validation/sanitize";

// ============================================================================
// Types
// ============================================================================

type ExportFormat = "csv" | "json" | "pdf";
type ExportDataType = JSONExportMetadata["dataType"];
type Aggregation = "none" | "daily" | "weekly" | "monthly";

interface ExportConfig {
  format: ExportFormat;
  dataType: ExportDataType;
  columns: string[];
  dateRange: { start: string; end: string } | null;
  aggregation: Aggregation;
}

interface ColumnOption {
  key: string;
  label: string;
  enabled: boolean;
}

interface ExportDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Called to close the dialog */
  onClose: () => void;
  /** Available columns for the data type */
  columns: ColumnOption[];
  /** The data to export */
  data: Record<string, unknown>[];
  /** The title of the data table */
  title: string;
  /** The type of data being exported */
  dataType: ExportDataType;
}

// ============================================================================
// Constants
// ============================================================================

const DATA_TYPE_LABELS: Record<ExportDataType, string> = {
  meters: "Meters",
  streams: "Streams",
  billing: "Billing",
  transactions: "Transactions",
};

const AGGREGATION_LABELS: Record<Aggregation, string> = {
  none: "No aggregation",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const FORMAT_LABELS: Record<ExportFormat, string> = {
  csv: "CSV (.csv) — Best for Excel, Google Sheets",
  json: "JSON (.json) — Best for API integration",
  pdf: "PDF (.pdf) — Best for printing & sharing",
};

// ============================================================================
// Component
// ============================================================================

export function ExportDialog({
  isOpen,
  onClose,
  columns,
  data,
  title,
  dataType,
}: ExportDialogProps) {
  const [config, setConfig] = useState<ExportConfig>({
    format: "csv",
    dataType,
    columns: columns.filter((c) => c.enabled).map((c) => c.key),
    dateRange: null,
    aggregation: "none",
  });

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleColumnToggle = useCallback((key: string) => {
    setConfig((prev) => ({
      ...prev,
      columns: prev.columns.includes(key)
        ? prev.columns.filter((c) => c !== key)
        : [...prev.columns, key],
    }));
  }, []);

  const handleExport = useCallback(async () => {
    if (config.columns.length === 0) {
      setExportError("Please select at least one column to export.");
      return;
    }

    setIsExporting(true);
    setExportError(null);
    setProgress(0);

    try {
      const filteredData = filterData(data, config);

      // Simulate progress for large datasets
      const chunkSize = Math.max(1, Math.floor(filteredData.length / 10));
      for (let i = 0; i < filteredData.length; i += chunkSize) {
        setProgress(Math.min(100, Math.round((i / filteredData.length) * 100)));
        await new Promise((r) => setTimeout(r, 0)); // Yield to UI
      }
      setProgress(100);

      const timestamp = new Date().toISOString().split("T")[0];
      const baseFilename = `equipchain-${config.dataType}-${timestamp}`;

      switch (config.format) {
        case "csv": {
          const csvColumns: CSVColumn[] = columns
            .filter((c) => config.columns.includes(c.key))
            .map((c) => ({ header: c.label, accessor: c.key }));
          const csv = generateCSV(filteredData, { columns: csvColumns });
          downloadCSV(csv, baseFilename);
          break;
        }
        case "json": {
          const jsonExport = generateJSON(
            filteredData,
            config.dataType,
            config.dateRange
              ? {
                  start: new Date(config.dateRange.start),
                  end: new Date(config.dateRange.end),
                }
              : undefined
          );
          downloadJSON(jsonExport, baseFilename);
          break;
        }
        case "pdf": {
          // PDF export uses browser's built-in print functionality
          // For production use, integrate with @react-pdf/renderer
          printAsPDF(title, filteredData, config);
          break;
        }
      }

      onClose();
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : "Export failed. Please try again."
      );
    } finally {
      setIsExporting(false);
    }
  }, [config, data, title, columns, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Export configuration"
    >
      <div className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Export {title}
            </h2>
            <p className="text-sm text-text-muted mt-0.5">
              {DATA_TYPE_LABELS[config.dataType]} &middot; {data.length.toLocaleString()} records
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-secondary text-text-muted hover:text-text-primary transition-colors"
            aria-label="Close dialog"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Export Format
            </label>
            <div className="space-y-2">
              {(Object.entries(FORMAT_LABELS) as [ExportFormat, string][]).map(
                ([format, label]) => (
                  <label
                    key={format}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      config.format === format
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                        : "border-border hover:border-brand-300 hover:bg-surface-secondary"
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportFormat"
                      value={format}
                      checked={config.format === format}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          format: e.target.value as ExportFormat,
                        }))
                      }
                      className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-text-primary">{label}</span>
                  </label>
                )
              )}
            </div>
          </div>

          {/* Column Selection */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Columns to Export
            </label>
            <div className="max-h-40 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
              {columns.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-secondary cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={config.columns.includes(col.key)}
                    onChange={() => handleColumnToggle(col.key)}
                    className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                  />
                  <span className="text-sm text-text-primary">{col.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              <span className="flex items-center gap-2">
                Date Range
                <span className="text-text-muted font-normal">(optional)</span>
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={config.dateRange?.start ?? ""}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      dateRange: {
                        start: e.target.value,
                        end: prev.dateRange?.end ?? "",
                      },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={config.dateRange?.end ?? ""}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      dateRange: {
                        start: prev.dateRange?.start ?? "",
                        end: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Aggregation Options */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Aggregation
            </label>
            <select
              value={config.aggregation}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  aggregation: e.target.value as Aggregation,
                }))
              }
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              {(Object.entries(AGGREGATION_LABELS) as [Aggregation, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Error Message */}
          {exportError && (
            <div className="p-3 rounded-lg bg-error-light dark:bg-red-900/20 border border-error/30">
              <p className="text-sm text-error-dark dark:text-error-light">
                {exportError}
              </p>
            </div>
          )}

          {/* Progress Bar */}
          {isExporting && (
            <div>
              <div className="flex justify-between text-xs text-text-muted mb-1">
                <span>Preparing export...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || config.columns.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export {config.columns.length} Column
                {config.columns.length !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function filterData(
  data: Record<string, unknown>[],
  config: ExportConfig
): Record<string, unknown>[] {
  let filtered = [...data];

  // Apply date range filter
  if (config.dateRange?.start || config.dateRange?.end) {
    const startDate = config.dateRange.start
      ? new Date(config.dateRange.start)
      : null;
    const endDate = config.dateRange.end
      ? new Date(config.dateRange.end)
      : null;

    filtered = filtered.filter((row) => {
      // Look for date fields in the row
      const dateField = row.date ?? row.timestamp ?? row.period;
      if (!dateField) return true; // No date field, include row

      const rowDate = new Date(dateField as string | number);
      if (startDate && rowDate < startDate) return false;
      if (endDate) {
        // Extend end date to end of day
        endDate.setHours(23, 59, 59, 999);
        if (rowDate > endDate) return false;
      }
      return true;
    });
  }

  // Apply aggregation (simplified - in production, this would be more sophisticated)
  if (config.aggregation !== "none") {
    // Basic aggregation: return data as-is, actual aggregation
    // is handled on the server side for large datasets
    console.log(
      `[export] Aggregation mode: ${config.aggregation} — server-side aggregation recommended for production.`
    );
  }

  return filtered;
}

function printAsPDF(
  title: string,
  data: Record<string, unknown>[],
  config: ExportConfig
): void {
  // Create a temporary window for printing
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error(
      "Unable to open print window. Please allow popups for this site."
    );
  }

  const timestamp = new Date().toLocaleString();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title} - EquipChain Export</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 40px; color: #1a1a1a; }
        h1 { font-size: 24px; margin-bottom: 4px; }
        .meta { color: #666; font-size: 14px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 8px 12px; background: #f5f5f5; border-bottom: 2px solid #ddd; font-weight: 600; }
        td { padding: 8px 12px; border-bottom: 1px solid #eee; }
        tr:hover td { background: #fafafa; }
        .footer { margin-top: 24px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="meta">
        Exported ${timestamp} &middot; ${data.length.toLocaleString()} records &middot; EquipChain
        ${config.dateRange ? `&middot; ${config.dateRange.start} to ${config.dateRange.end}` : ""}
      </p>
      <table>
        <thead>
          <tr>${config.columns.map((col) => `<th>${sanitizeString(col)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${data
            .map(
              (row) =>
                `<tr>${config.columns
                  .map((col) => `<td>${sanitizeString(String(row[col] ?? ""))}</td>`)
                  .join("")}</tr>`
            )
            .join("\n")}
        </tbody>
      </table>
      <p class="footer">
        Generated by EquipChain &mdash; ${timestamp}
      </p>
      <script>window.onload = () => window.print();</script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
