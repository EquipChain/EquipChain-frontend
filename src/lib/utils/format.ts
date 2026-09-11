import { format, formatDistanceToNow, parseISO } from "date-fns";

// ============================================================================
// Formatters — single source of truth for user-facing data presentation
// ============================================================================
// Every page renders numbers and dates via raw string interpolation of
// placeholder rows ("15,420 kWh", "2024-03-15"). There is no locale handling,
// no consistent precision, and no way to test presentation rules. These
// helpers centralize formatting using Intl APIs (locale-aware, no deps) so
// the whole app renders consistently and the rules are unit-testable.

/**
 * Formats a number with locale digit grouping, e.g. 125000 -> "125,000".
 * `fractionDigits` controls decimal precision (default 0).
 */
export function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/**
 * Formats a compact number for constrained UI (stat cards, sparkline axes),
 * e.g. 1250000 -> "1.3M", 15420 -> "15.4K".
 */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Formats a currency amount, e.g. 1494 -> "$1,494.00".
 * `currency` defaults to USD.
 */
export function formatCurrency(
  value: number,
  currency = "USD",
  fractionDigits = 2
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/**
 * Formats a percentage, e.g. 5.32 -> "5.3%". Handles sign and precision.
 */
export function formatPercent(value: number, fractionDigits = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value, fractionDigits)}%`;
}

/**
 * Formats an ISO date string (or Date) as "Mar 15, 2024".
 * Returns the raw input when unparseable so callers never render "Invalid Date".
 */
export function formatDate(input: string | Date): string {
  try {
    const date = typeof input === "string" ? parseISO(input) : input;
    if (Number.isNaN(date.getTime())) return String(input);
    return format(date, "MMM d, yyyy");
  } catch {
    return String(input);
  }
}

/**
 * Formats an ISO datetime as "Mar 15, 2024, 2:32 PM".
 * Returns the raw input when unparseable.
 */
export function formatDateTime(input: string | Date): string {
  try {
    const date = typeof input === "string" ? parseISO(input) : input;
    if (Number.isNaN(date.getTime())) return String(input);
    return format(date, "MMM d, yyyy, h:mm a");
  } catch {
    return String(input);
  }
}

/**
 * Relative time for recency indicators, e.g. "5 min ago", "about 2 hours ago".
 * Falls back to absolute date for anything older than 7 days.
 */
export function formatRelativeTime(input: string | Date): string {
  try {
    const date = typeof input === "string" ? parseISO(input) : input;
    if (Number.isNaN(date.getTime())) return String(input);
    if (Date.now() - date.getTime() > 7 * 24 * 60 * 60 * 1000) {
      return formatDate(date);
    }
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return String(input);
  }
}

/**
 * Formats a value + unit pair with grouped digits, e.g. 125000, "kWh"
 * -> "125,000 kWh". Unit is rendered unmodified so domain strings like
 * "m³" pass through.
 */
export function formatConsumption(value: number, unit: string): string {
  return `${formatNumber(value)} ${unit}`;
}

/**
 * Formats a Stellar address for display, e.g. "GABC...XYZ".
 * Addresses are 56 chars; showing them raw breaks table layouts.
 */
export function formatStellarAddress(address: string, visibleChars = 4): string {
  if (address.length <= visibleChars * 2 + 3) return address;
  return `${address.slice(0, visibleChars)}...${address.slice(-visibleChars)}`;
}

/**
 * Byte size for export/cache UI, e.g. 1536 -> "1.5 KB".
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = -1;
  do {
    value /= 1024;
    unitIndex += 1;
  } while (value >= 1024 && unitIndex < units.length - 1);
  return `${formatNumber(value, 1)} ${units[unitIndex]}`;
}
