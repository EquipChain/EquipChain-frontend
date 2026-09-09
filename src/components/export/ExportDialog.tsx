"use client";

import { useState, useCallback } from "react";
import { Download } from "lucide-react";
import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import { Field, Label } from "@/src/components/ui/Input";
import { generateCSV, downloadCSV } from "@/src/lib/export/csv";
import type { CSVColumn } from "@/src/lib/export/csv";
import { generateJSON, downloadJSON } from "@/src/lib/export/json";
import type { JSONExportMetadata } from "@/src/lib/export/json";
import { useToast } from "@/src/components/ui/toast";
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
  const { toast } = useToast();

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

      toast({
        title: "Export ready",
        description: `${filteredData.length} record${
          filteredData.length === 1 ? "" : "s"
        } exported as ${config.format.toUpperCase()}.`,
        variant: "success",
      });
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Export failed. Please try again.";
      setExportError(message);
      toast({
        title: "Export failed",
        description: message,
        variant: "error",
      });
    } finally {
      setIsExporting(false);
    }
  }, [config, data, title, columns, onClose, toast]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Export ${title}`}
      description={`${DATA_TYPE_LABELS[config.dataType]} · ${data.length.toLocaleString()} records`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || config.columns.length === 0}
            loading={isExporting}
          >
            {isExporting ? (
              "Exporting..."
            ) : (
              <>
                <Download className="h-4 w-4" aria-hidden="true" />
                Export {config.columns.length} Column
                {config.columns.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Format Selection */}
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-text-secondary">
            Export Format
          </legend>
          <div className="space-y-2">
            {(Object.entries(FORMAT_LABELS) as [ExportFormat, string][]).map(
              ([format, label]) => (
                <label
                  key={format}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
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
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-text-primary">{label}</span>
                </label>
              )
            )}
          </div>
        </fieldset>

        {/* Column Selection */}
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-text-secondary">
            Columns to Export
          </legend>
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
            {columns.map((col) => (
              <label
                key={col.key}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-surface-secondary"
              >
                <input
                  type="checkbox"
                  checked={config.columns.includes(col.key)}
                  onChange={() => handleColumnToggle(col.key)}
                  className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-text-primary">{col.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Date Range Filter */}
        <div>
          <Label className="mb-2">
            Date Range <span className="font-normal text-text-muted">(optional)</span>
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Start Date"
              inputProps={{
                type: "date",
                value: config.dateRange?.start ?? "",
                onChange: (e) =>
                  setConfig((prev) => ({
                    ...prev,
                    dateRange: {
                      start: e.target.value,
                      end: prev.dateRange?.end ?? "",
                    },
                  })),
              }}
            />
            <Field
              label="End Date"
              inputProps={{
                type: "date",
                value: config.dateRange?.end ?? "",
                onChange: (e) =>
                  setConfig((prev) => ({
                    ...prev,
                    dateRange: {
                      start: prev.dateRange?.start ?? "",
                      end: e.target.value,
                    },
                  })),
                max: config.dateRange?.start
                  ? undefined
                  : config.dateRange?.start,
              }}
            />
          </div>
        </div>

        {/* Aggregation Options */}
        <div>
          <label htmlFor="export-aggregation" className="mb-2 block text-sm font-medium text-text-secondary">
            Aggregation
          </label>
          <select
            id="export-aggregation"
            value={config.aggregation}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                aggregation: e.target.value as Aggregation,
              }))
            }
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
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
          <div
            role="alert"
            className="rounded-lg border border-error/30 bg-error-light p-3 dark:bg-red-900/20"
          >
            <p className="text-sm text-error-dark dark:text-error-light">
              {exportError}
            </p>
          </div>
        )}

        {/* Progress Bar */}
        {isExporting && (
          <div>
            <div className="mb-1 flex justify-between text-xs text-text-muted">
              <span>Preparing export...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-secondary">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
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
      <title>${sanitizeString(title)} - EquipChain Export</title>
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
      <h1>${sanitizeString(title)}</h1>
      <p class="meta">
        Exported ${sanitizeString(timestamp)} &middot; ${data.length.toLocaleString()} records &middot; EquipChain
        ${config.dateRange ? `&middot; ${sanitizeString(config.dateRange.start)} to ${sanitizeString(config.dateRange.end)}` : ""}
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
        Generated by EquipChain &mdash; ${sanitizeString(timestamp)}
      </p>
      <script>window.onload = () => window.print();<\/script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
