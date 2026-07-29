// ============================================================================
// JSON Export Utility
// Generates versioned JSON exports with schema metadata.
// ============================================================================

/**
 * Metadata included in every JSON export.
 */
export interface JSONExportMetadata {
  /** Schema version for forward compatibility */
  schemaVersion: "1.0.0";
  /** Timestamp of export generation (ISO 8601) */
  exportedAt: string;
  /** Type of data being exported */
  dataType: "meters" | "streams" | "billing" | "transactions";
  /** Total number of records in the export */
  recordCount: number;
  /** Application name */
  source: "EquipChain";
  /** Optional date range filter applied */
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Full JSON export structure with metadata and data.
 */
export interface JSONExport<T = unknown> {
  metadata: JSONExportMetadata;
  data: T[];
}

/**
 * Generates a versioned JSON export with metadata.
 *
 * @param data - Array of data records to export
 * @param dataType - Type of data being exported
 * @param dateRange - Optional date range filter that was applied
 * @returns A structured JSON export object
 */
export function generateJSON<T>(
  data: T[],
  dataType: JSONExportMetadata["dataType"],
  dateRange?: { start: Date; end: Date }
): JSONExport<T> {
  return {
    metadata: {
      schemaVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
      dataType,
      recordCount: data.length,
      source: "EquipChain",
      ...(dateRange && {
        dateRange: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        },
      }),
    },
    data,
  };
}

/**
 * Converts a JSON export to a downloadable Blob.
 */
export function jsonToBlob<T>(exportData: JSONExport<T>): Blob {
  const jsonString = JSON.stringify(exportData, null, 2);
  return new Blob([jsonString], {
    type: "application/json;charset=utf-8;",
  });
}

/**
 * Triggers a browser download for JSON export data.
 */
export function downloadJSON<T>(
  exportData: JSONExport<T>,
  filename: string
): void {
  const blob = jsonToBlob(exportData);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
