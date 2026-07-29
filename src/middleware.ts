// ============================================================================
// Security Middleware
// Applies HTTP security headers to all responses and handles CSRF protection
// ============================================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCsrfConfig, requiresCsrfProtection, verifyCsrfToken, createCsrfTokenPair } from "@/src/lib/security/csrf";

// ============================================================================
// Security Headers Configuration
// ============================================================================

/**
 * Content Security Policy header value.
 * Restricts sources for scripts, styles, connections, etc.
 *
 * - default-src 'self': Only allow resources from the same origin by default
 * - script-src 'self': Only allow scripts from the same origin
 * - connect-src 'self' https://*.stellar.org: Allow API calls to Stellar network
 * - img-src 'self' data: : Allow images from same origin and inline data URIs
 * - style-src 'self' 'unsafe-inline': Allow styles from same origin + Tailwind inline styles
 * - frame-ancestors 'none': Prevent clickjacking
 * - form-action 'self': Prevent form hijacking
 * - base-uri 'self': Prevent base tag injection
 * - object-src 'none': Block Flash/Java/plugins
 */
const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "connect-src 'self' https://*.stellar.org https://horizon.stellar.org https://soroban-rpc.stellar.org",
  "img-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

/**
 * Permissions Policy header value.
 * Restricts browser features that the page can use.
 */
const PERMISSIONS_POLICY = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "interest-cohort=()", // Disable FLoC tracking
  "payment=()",
  "usb=()",
  "bluetooth=()",
  "magnetometer=()",
  "gyroscope=()",
  "accelerometer=()",
].join(", ");

// ============================================================================
// Middleware Entry Point
// ============================================================================

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Set all security headers
  setSecurityHeaders(response);

  // 2. CSRF token provisioning: GET /api/csrf-token returns a CSRF token cookie
  if (
    request.nextUrl.pathname === "/api/csrf-token" &&
    request.method === "GET"
  ) {
    return provisionCsrfToken(response);
  }

  // 3. CSRF protection for state-changing API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return handleApiSecurity(request, response);
  }

  // 4. Only set Cache-Control on HTML document requests (not static assets)
  const acceptHeader = request.headers.get("accept") ?? "";
  if (acceptHeader.includes("text/html")) {
    response.headers.set("Cache-Control", "no-store, max-age=0");
  }

  return response;
}

// ============================================================================
// Security Header Application
// ============================================================================

function setSecurityHeaders(response: NextResponse): void {
  const headers = response.headers;

  // Content Security Policy
  headers.set("Content-Security-Policy", CSP_POLICY);

  // HTTP Strict Transport Security (1 year, include subdomains, preload list)
  headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );

  // Prevent MIME type sniffing
  headers.set("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking
  headers.set("X-Frame-Options", "DENY");

  // Control referrer information
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Restrict browser features
  headers.set("Permissions-Policy", PERMISSIONS_POLICY);

  // Remove potentially dangerous headers
  headers.delete("X-Powered-By");

  // Disable IE compatibility mode
  headers.set("X-UA-Compatible", "IE=edge");
}

// ============================================================================
// API Security
// ============================================================================

function handleApiSecurity(
  request: NextRequest,
  baseResponse: NextResponse
): NextResponse {
  const method = request.method;

  // Only state-changing methods need CSRF protection
  if (!requiresCsrfProtection(method)) {
    return baseResponse;
  }

  const { cookieName, headerName } = getCsrfConfig();
  const submittedToken = request.headers.get(headerName);
  const signedToken = request.cookies.get(cookieName)?.value;

  if (!submittedToken || !signedToken) {
    return NextResponse.json(
      {
        error: "CSRF token missing",
        message: `Include the CSRF token in the '${headerName}' header and ensure the '${cookieName}' cookie is set.`,
      },
      { status: 403 }
    );
  }

  if (!verifyCsrfToken(submittedToken, signedToken)) {
    return NextResponse.json(
      {
        error: "Invalid CSRF token",
        message: "The provided CSRF token is invalid or has expired.",
      },
      { status: 403 }
    );
  }

  // Check for wallet origin if the request involves wallet operations
  const walletOrigin = request.headers.get("x-wallet-origin");
  if (walletOrigin) {
    return validateWalletOrigin(walletOrigin, baseResponse);
  }

  return baseResponse;
}

// ============================================================================
// CSRF Token Provisioning
// ============================================================================

function provisionCsrfToken(response: NextResponse): NextResponse {
  const { token, cookieHeader } = createCsrfTokenPair();

  response.headers.set("Set-Cookie", cookieHeader);

  return NextResponse.json(
    { token, message: "CSRF token issued. Include it in the x-csrf-token header for state-changing requests." },
    { status: 200, headers: response.headers }
  );
}

// ============================================================================
// Wallet Origin Validation
// ============================================================================

const TRUSTED_WALLET_ORIGINS = [
  "https://freighter.app",
  "https://albedo.link",
  "https://rabet.io",
  "https://lobstr.co",
  "https://xbull.app",
];

function validateWalletOrigin(
  origin: string,
  baseResponse: NextResponse
): NextResponse {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isLocalhost = origin.startsWith("http://localhost");
  const isTrusted = TRUSTED_WALLET_ORIGINS.some((trusted) =>
    origin.startsWith(trusted)
  );

  if (!isDevelopment && !isLocalhost && !isTrusted) {
    return NextResponse.json(
      {
        error: "Untrusted wallet origin",
        message:
          "Wallet connections are only allowed from trusted origins: " +
          TRUSTED_WALLET_ORIGINS.join(", "),
      },
      { status: 403 }
    );
  }

  return baseResponse;
}

// ============================================================================
// Middleware Config
// ============================================================================

/**
 * Configures which paths the middleware runs on.
 * We apply security headers to ALL routes for maximum coverage.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icon-*.png (PWA icons)
     * - sw.js (service worker)
     */
    "/((?!_next/static|_next/image|favicon.ico|icon-.*\\.png|sw\\.js).*)",
  ],
};
