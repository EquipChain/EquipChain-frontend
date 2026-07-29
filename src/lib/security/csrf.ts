// ============================================================================
// CSRF Protection Utilities
// Generates and verifies CSRF tokens for state-changing API requests
// ============================================================================

import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";

const CSRF_SECRET =
  process.env.CSRF_SECRET ??
  (process.env.NODE_ENV === "production"
    ? ""
    : "dev-csrf-secret-do-not-use-in-production");

const TOKEN_BYTE_LENGTH = 32;
const COOKIE_NAME = "__Host-csrf-token";
const HEADER_NAME = "x-csrf-token";

/**
 * Generates a cryptographically secure CSRF token.
 * Returns the raw token value (not HMAC'd).
 */
export function generateCsrfToken(): string {
  if (!CSRF_SECRET && process.env.NODE_ENV === "production") {
    throw new Error(
      "CSRF_SECRET environment variable is required in production"
    );
  }
  return randomBytes(TOKEN_BYTE_LENGTH).toString("hex");
}

/**
 * Creates a signed version of a CSRF token using HMAC-SHA256.
 * The signed token is what gets sent to the client as a cookie.
 */
export function signCsrfToken(token: string): string {
  const hmac = createHmac("sha256", CSRF_SECRET);
  hmac.update(token);
  return hmac.digest("hex");
}

/**
 * Verifies that a submitted CSRF token matches the expected value.
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param submittedToken - The token from the request header
 * @param signedToken - The signed token from the cookie
 * @returns true if the token is valid
 */
export function verifyCsrfToken(
  submittedToken: string,
  signedToken: string
): boolean {
  if (!submittedToken || !signedToken) return false;

  try {
    // Re-sign the submitted token and compare with the signed cookie value
    const expectedSignature = signCsrfToken(submittedToken);

    const submittedBuf = Buffer.from(signedToken, "hex");
    const expectedBuf = Buffer.from(expectedSignature, "hex");

    // Constant-time comparison
    if (submittedBuf.length !== expectedBuf.length) return false;
    return timingSafeEqual(submittedBuf, expectedBuf);
  } catch {
    return false;
  }
}

/**
 * Generates the CSRF cookie string for Set-Cookie header.
 */
export function generateCsrfCookie(token: string): string {
  const signed = signCsrfToken(token);
  const isProd = process.env.NODE_ENV === "production";

  const cookieParts = [
    `${COOKIE_NAME}=${signed}`,
    "Path=/",
    "SameSite=Strict",
    isProd ? "Secure" : "",
    "HttpOnly",
    "Max-Age=86400", // 24 hours
  ];

  return cookieParts.filter(Boolean).join("; ");
}

/**
 * Returns the cookie and header names used for CSRF protection.
 */
export function getCsrfConfig() {
  return {
    cookieName: COOKIE_NAME,
    headerName: HEADER_NAME,
  };
}

/**
 * Determines if a request method requires CSRF protection.
 * Only state-changing methods need CSRF tokens.
 */
export function requiresCsrfProtection(method: string): boolean {
  const stateChangingMethods = ["POST", "PUT", "PATCH", "DELETE"];
  return stateChangingMethods.includes(method.toUpperCase());
}

/**
 * Creates a CSRF token and its corresponding cookie value.
 * Use this in API responses to set the CSRF cookie.
 */
export function createCsrfTokenPair(): {
  token: string;
  cookieHeader: string;
} {
  const token = generateCsrfToken();
  const cookieHeader = generateCsrfCookie(token);
  return { token, cookieHeader };
}
