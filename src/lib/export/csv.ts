// ============================================================================
// CSV Export Utility
// Generates properly escaped CSV data from structured data arrays.
// Handles special characters, commas, quotes, and newlines in cell values.
// ============================================================================

/**
 * Escapes a single CSV cell value according to RFC 4180.
 * - Wraps in double quotes if the value contains commas, quotes, or newlines
 * - Doubles up any internal double quotes
 */
function escapeCSVCell(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);

  // Check if quoting is needed
  const needsQuoting =
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r") ||
    str.includes(";");

  if (needsQuoting) {
    // Double up any double quotes and wrap in quotes
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Valid column definition for CSV export
 */
export interface CSVColumn<T = Record<string, unknown>> {
  /** The column header displayed in the first row */
  header: string;
  /** Accessor: key name or a function that extracts the value from a row */
  accessor: keyof T | ((row: T) => unknown);
}

/**
 * Options for CSV generation
 */
export interface CSVOptions<T = Record<string, unknown>> {
  /** Column definitions */
  columns: CSVColumn<T>[];
  /** Optional BOM (Byte Order Mark) for Excel UTF-8 compatibility */
  includeBOM?: boolean;
  /** Line ending style */
  lineEnding?: "\r\n" | "\n";
}

/**
 * Generates a CSV string from an array of data objects.
 *
 * @example
 * ```ts
 * const data = [{ name: "Meter A", reading: 150.5, date: "2024-01-01" }];
 * const csv = generateCSV(data, {
 *   columns: [
 *     { header: "Name", accessor: "name" },
 *     { header: "Reading", accessor: "reading" },
 *     { header: "Date", accessor: (row) => new Date(row.date).toLocaleDateString() },
 *   ],
 * });
 * ```
 */
export function generateCSV<T extends Record<string, unknown>>(
  data: T[],
  options: CSVOptions<T>
): string {
  const { columns, includeBOM = true, lineEnding = "\r\n" } = options;

  const lines: string[] = [];

  // Header row
  const headerRow = columns.map((col) => escapeCSVCell(col.header)).join(",");
  lines.push(headerRow);

  // Data rows
  for (const row of data) {
    const cells = columns.map((col) => {
      const value =
        typeof col.accessor === "function"
          ? col.accessor(row)
          : row[col.accessor as string];
      return escapeCSVCell(value);
    });
    lines.push(cells.join(","));
  }

  let csv = lines.join(lineEnding);

  // Prepend BOM for Excel UTF-8 compatibility
  if (includeBOM) {
    csv = "\uFEFF" + csv;
  }

  return csv;
}

/**
 * Converts CSV data to a downloadable Blob.
 */
export function csvToBlob(csv: string): Blob {
  return new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });
}

/**
 * Triggers a browser download for CSV data.
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = csvToBlob(csv);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
