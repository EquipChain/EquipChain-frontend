// ============================================================================
// Input Sanitization Utilities
// Prevents XSS attacks by sanitizing user input before rendering or storage
// ============================================================================

/** HTML entity map for escaping */
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

/**
 * Escapes HTML special characters to prevent XSS when rendering user content.
 * Use this for any user-generated content that gets rendered as HTML.
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] ?? char);
}

/**
 * Sanitizes a string by removing potentially dangerous HTML/SVG/math tags
 * and event handlers. More thorough than simple HTML escaping.
 */
export function sanitizeString(str: string): string {
  let sanitized = str;

  // Remove script tags and their content
  sanitized = sanitized.replace(
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    ""
  );

  // Remove style tags and their content
  sanitized = sanitized.replace(
    /<style[^>]*>[\s\S]*?<\/style>/gi,
    ""
  );

  // Remove HTML comments
  sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, "");

  // Remove event handler attributes (onclick, onload, onerror, etc.)
  sanitized = sanitized.replace(
    /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
    ""
  );

  // Remove javascript: protocol URLs
  sanitized = sanitized.replace(
    /javascript\s*:/gi,
    "blocked:"
  );

  // Remove data: URLs that could contain HTML
  sanitized = sanitized.replace(
    /data\s*:\s*text\/html[^"'\s>]*/gi,
    "blocked:"
  );

  // Remove vbscript: protocol
  sanitized = sanitized.replace(
    /vbscript\s*:/gi,
    "blocked:"
  );

  // Escape remaining HTML entities for safe rendering
  sanitized = escapeHtml(sanitized);

  return sanitized;
}

/**
 * Sanitizes an object's string values recursively.
 * Useful for sanitizing entire request bodies or API responses.
 */
export function sanitizeObject<T>(obj: T): T {
  if (typeof obj === "string") {
    return sanitizeString(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }

  if (obj !== null && typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(
      obj as Record<string, unknown>
    )) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized as T;
  }

  return obj;
}

/**
 * Validates that a URL is safe (no javascript: or data: protocols).
 * Returns the original URL if safe, or an empty string if not.
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim().toLowerCase();

  const dangerousProtocols = [
    "javascript:",
    "data:",
    "vbscript:",
    "file:",
  ];

  if (dangerousProtocols.some((proto) => trimmed.startsWith(proto))) {
    return "";
  }

  // Allow only http, https, and relative URLs
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../")
  ) {
    return url;
  }

  return "";
}

/**
 * Sanitizes file names to prevent path traversal attacks.
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path separators and null bytes
  let sanitized = fileName
    .replace(/[\x00-\x1f\x7f-\x9f]/g, "") // Remove control characters
    .replace(/[/\\:*?"<>|]/g, "_") // Replace invalid filename characters
    .replace(/^\.+/, "") // Remove leading dots (hidden files)
    .trim();

  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }

  return sanitized || "unnamed";
}

/**
 * Strips SQL-like patterns from input (basic SQL injection prevention).
 * Note: Use parameterized queries at the database level for proper protection.
 */
export function sanitizeSqlInput(input: string): string {
  return input
    .replace(/['";\\]/g, "") // Remove SQL-significant characters
    .replace(/--/g, "") // Remove SQL comments
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
    .replace(/\b(DROP|DELETE|INSERT|UPDATE|ALTER|TRUNCATE|EXEC|UNION)\b/gi, "");
}
