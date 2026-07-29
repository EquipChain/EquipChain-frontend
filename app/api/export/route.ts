// ============================================================================
// Export API Route
// Handles server-side data export with streaming for large datasets.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";

// Maximum records per export request
const MAX_RECORDS = Number(process.env.EXPORT_MAX_RECORDS ?? 50000);

// Rate limiting: simple in-memory store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.API_RATE_LIMIT ?? 10);

/**
 * Supported export formats
 */
type ExportFormat = "csv" | "json" | "pdf";

/**
 * Request body for export endpoint
 */
interface ExportRequestBody {
  format: ExportFormat;
  dataType: "meters" | "streams" | "billing" | "transactions";
  columns: string[];
  dateRange?: { start: string; end: string };
  aggregation?: "none" | "daily" | "weekly" | "monthly";
}

// ============================================================================
// Rate Limiting
// ============================================================================

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true };
}

// ============================================================================
// Validation
// ============================================================================

function validateExportRequest(body: unknown): {
  valid: true;
  data: ExportRequestBody;
} | {
  valid: false;
  error: string;
} {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body is required." };
  }

  const { format, dataType, columns, dateRange, aggregation } =
    body as Record<string, unknown>;

  const validFormats: ExportFormat[] = ["csv", "json", "pdf"];
  const validDataTypes = ["meters", "streams", "billing", "transactions"];
  const validAggregations = ["none", "daily", "weekly", "monthly"];

  if (!validFormats.includes(format as ExportFormat)) {
    return {
      valid: false,
      error: `Invalid format. Must be one of: ${validFormats.join(", ")}`,
    };
  }

  if (!validDataTypes.includes(dataType as string)) {
    return {
      valid: false,
      error: `Invalid dataType. Must be one of: ${validDataTypes.join(", ")}`,
    };
  }

  if (!Array.isArray(columns) || columns.length === 0) {
    return {
      valid: false,
      error: "At least one column must be specified.",
    };
  }

  if (
    !columns.every(
      (col: unknown) => typeof col === "string" && col.length > 0
    )
  ) {
    return { valid: false, error: "All columns must be non-empty strings." };
  }

  if (dateRange) {
    if (
      typeof dateRange !== "object" ||
      !("start" in dateRange) ||
      !("end" in dateRange)
    ) {
      return {
        valid: false,
        error: "dateRange must have start and end fields.",
      };
    }

    const start = new Date(dateRange.start as string);
    const end = new Date(dateRange.end as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        valid: false,
        error: "dateRange start and end must be valid date strings.",
      };
    }

    if (start > end) {
      return {
        valid: false,
        error: "dateRange start must be before end.",
      };
    }
  }

  if (aggregation && !validAggregations.includes(aggregation as string)) {
    return {
      valid: false,
      error: `Invalid aggregation. Must be one of: ${validAggregations.join(", ")}`,
    };
  }

  return {
    valid: true,
    data: {
      format: format as ExportFormat,
      dataType: dataType as ExportRequestBody["dataType"],
      columns: columns as string[],
      dateRange: dateRange as { start: string; end: string } | undefined,
      aggregation: aggregation as ExportRequestBody["aggregation"],
    },
  };
}

// ============================================================================
// Data Fetching (Placeholder - replace with actual DB queries)
// ============================================================================

function generateCSVString(columns: string[], rows: Record<string, unknown>[]): string {
  const escape = (val: unknown): string => {
    const s = String(val ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const header = columns.map(escape).join(",");
  const dataRows = rows.map((row) =>
    columns.map((col) => escape(row[col] ?? "")).join(",")
  );

  return `\uFEFF${header}\n${dataRows.join("\n")}\n`;
}

function generateJSONString(columns: string[], rows: Record<string, unknown>[]): string {
  const exportData = {
    metadata: {
      schemaVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
      source: "EquipChain",
      recordCount: rows.length,
    },
    columns,
    data: rows,
  };

  return JSON.stringify(exportData, null, 2);
}

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many export requests.",
        message: `Please wait ${rateLimit.retryAfter} seconds before trying again.`,
        retryAfter: rateLimit.retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfter),
        },
      }
    );
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  const validation = validateExportRequest(body);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  const { format, dataType, columns, dateRange, aggregation } = validation.data;

  try {
    // In production, fetch data from your database here.
    // This is a placeholder that returns empty data.
    // Replace with actual data fetching logic using your DB client.
    const data: Record<string, unknown>[] = await fetchExportData(
      dataType,
      dateRange,
      aggregation ?? "none"
    );

    // Apply row limit
    const limitedData = data.slice(0, MAX_RECORDS);
    const truncated = data.length > MAX_RECORDS;

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `equipchain-${dataType}-${timestamp}.${format}`;

    let responseBody: string;
    let contentType: string;

    switch (format) {
      case "csv":
        responseBody = generateCSVString(columns, limitedData);
        contentType = "text/csv; charset=utf-8";
        break;
      case "json":
        responseBody = generateJSONString(columns, limitedData);
        contentType = "application/json; charset=utf-8";
        break;
      case "pdf":
        // PDF generation on server requires a PDF library.
        // For now, return JSON as a placeholder with instructions.
        return NextResponse.json(
          {
            error: "Server-side PDF generation is not yet implemented.",
            message:
              "PDF export is available via the client-side print dialog. " +
              "For server-side PDF, install @react-pdf/renderer or similar.",
          },
          { status: 501 }
        );
      default:
        return NextResponse.json(
          { error: "Unsupported format." },
          { status: 400 }
        );
    }

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    };

    if (truncated) {
      headers["X-Export-Truncated"] = "true";
      headers["X-Export-Total-Records"] = String(data.length);
      headers["X-Export-Returned-Records"] = String(limitedData.length);
    }

    return new NextResponse(responseBody, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("[export] Error generating export:", error);
    return NextResponse.json(
      {
        error: "Failed to generate export.",
        message:
          error instanceof Error ? error.message : "Unknown error occurred.",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET Handler — Returns export capabilities
// ============================================================================

export async function GET() {
  return NextResponse.json({
    supported: {
      formats: ["csv", "json", "pdf"],
      dataTypes: ["meters", "streams", "billing", "transactions"],
      aggregations: ["none", "daily", "weekly", "monthly"],
      maxRecords: MAX_RECORDS,
      rateLimit: {
        maxRequests: RATE_LIMIT_MAX_REQUESTS,
        windowMs: RATE_LIMIT_WINDOW_MS,
      },
    },
    endpoints: {
      export: {
        method: "POST",
        path: "/api/export",
        body: {
          format: "csv | json | pdf",
          dataType: "meters | streams | billing | transactions",
          columns: ["column1", "column2"],
          dateRange: "{ start: string, end: string }",
          aggregation: "none | daily | weekly | monthly",
        },
      },
    },
  });
}

// ============================================================================
// Data Fetching (replace with actual database queries)
// ============================================================================

async function fetchExportData(
  dataType: string,
  _dateRange?: { start: string; end: string },
  _aggregation?: string
): Promise<Record<string, unknown>[]> {
  // TODO: Replace with actual data fetching from your database.
  // Example: const rows = await db.query('SELECT ... FROM ... WHERE ...');

  console.log(
    `[export] Fetching data for type=${dataType}, aggregation=${_aggregation ?? "none"}`
  );

  // Placeholder: return empty array.
  // In production, query your actual data source here.
  return [];
}
