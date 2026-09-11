import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

import { validatePublicEnv, detectSecretLeaks } from "./src/lib/security/env";

// Validate environment variables at build time
validatePublicEnv();
detectSecretLeaks();

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // public/sw.js is a build artifact checked into the repo only by accident:
  // its embedded precache manifest references chunk hashes from an old build,
  // so a stale worker would install on a fresh deploy and serve dead URLs.
  // Excluding it from the build here keeps the source of truth in app/sw.ts;
  // see .gitignore for the matching ignore rule.
  disable: process.env.NODE_ENV === "development",
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
