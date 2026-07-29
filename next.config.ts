import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

import { validatePublicEnv, detectSecretLeaks } from "./src/lib/security/env";

// Validate environment variables at build time
validatePublicEnv();
detectSecretLeaks();

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
});

// ============================================================================
// Security Headers Configuration
// Applied by middleware.ts for dynamic responses.
// These static headers provide defense-in-depth for static assets.
// ============================================================================

const securityHeaders = [
  // Prevent MIME type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Control referrer information
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Remove server identification
  { key: "X-Powered-By", value: "" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
    ];
  },
};

export default withSerwist(nextConfig);
