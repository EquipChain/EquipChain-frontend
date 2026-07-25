/**
 * Development proxy server for API requests.
 *
 * Usage: npm run dev:proxy
 *
 * Starts alongside next dev and proxies API requests to the backend.
 * Configure your backend URL by setting the BACKEND_URL environment variable.
 */

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001"

// This file is a placeholder for a custom development proxy.
// Next.js already handles API proxying via the rewrites() config
// in next.config.ts, so in most cases you don't need this proxy.
//
// If you need additional proxy behavior (e.g., WebSocket support,
// custom headers, or request transformation), implement it here
// using a library like http-proxy or express.

console.log(`[proxy] Proxying API requests to ${BACKEND_URL}`)
console.log(
  "[proxy] Next.js rewrites() in next.config.ts already handles /api/* proxying.",
)
console.log("[proxy] Add custom proxy logic here if needed.")
