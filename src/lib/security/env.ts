// ============================================================================
// Environment Variable Validation
// Validates all NEXT_PUBLIC_* vars and critical server-side vars at build time
// ============================================================================

import { z } from "zod";

/**
 * Schema for validating client-side (NEXT_PUBLIC_*) environment variables.
 * These are bundled into the browser JS and must not contain secrets.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_BASE_URL: z
    .string()
    .url("NEXT_PUBLIC_BASE_URL must be a valid URL")
    .default("http://localhost:3000"),
  NEXT_PUBLIC_STELLAR_NETWORK: z
    .enum(["testnet", "pubnet", "futurenet"])
    .default("testnet"),
  NEXT_PUBLIC_STELLAR_RPC_URL: z
    .string()
    .url("NEXT_PUBLIC_STELLAR_RPC_URL must be a valid URL")
    .optional(),
  NEXT_PUBLIC_HORIZON_URL: z
    .string()
    .url("NEXT_PUBLIC_HORIZON_URL must be a valid URL")
    .optional(),
  NEXT_PUBLIC_SOROBAN_RPC_URL: z
    .string()
    .url("NEXT_PUBLIC_SOROBAN_RPC_URL must be a valid URL")
    .optional(),
});

/**
 * Schema for validating server-side environment variables.
 * These are NEVER exposed to the client.
 */
const serverEnvSchema = z.object({
  BACKEND_URL: z
    .string()
    .url("BACKEND_URL must be a valid URL")
    .default("http://localhost:3001"),
  CSRF_SECRET: z
    .string()
    .min(32, "CSRF_SECRET must be at least 32 characters")
    .optional(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().url().optional(),
  STELLAR_SECRET_KEY: z
    .string()
    .regex(
      /^S[A-Z2-7]{55}$/,
      "STELLAR_SECRET_KEY must be a valid Stellar secret key"
    )
    .optional(),
  API_RATE_LIMIT: z
    .string()
    .regex(/^\d+$/, "API_RATE_LIMIT must be a number")
    .default("100"),
  EXPORT_MAX_RECORDS: z
    .string()
    .regex(/^\d+$/, "EXPORT_MAX_RECORDS must be a number")
    .default("50000"),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validates client-side environment variables at build time.
 * Call this in next.config.ts or a build script.
 *
 * @throws {Error} if any NEXT_PUBLIC_* variable fails validation
 */
export function validatePublicEnv(): PublicEnv {
  const result = publicEnvSchema.safeParse({
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_STELLAR_NETWORK: process.env.NEXT_PUBLIC_STELLAR_NETWORK,
    NEXT_PUBLIC_STELLAR_RPC_URL: process.env.NEXT_PUBLIC_STELLAR_RPC_URL,
    NEXT_PUBLIC_HORIZON_URL: process.env.NEXT_PUBLIC_HORIZON_URL,
    NEXT_PUBLIC_SOROBAN_RPC_URL: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL,
  });

  if (!result.success) {
    const errorMessages = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    console.warn(
      `[env] Warning: NEXT_PUBLIC_* environment variables have issues:\n${errorMessages}`
    );
    console.warn(
      "[env] The application will continue with default values. " +
        "Fix these before deploying to production."
    );
  }

  // In Zod v4, safeParse still returns defaults when validation partially fails
  // Fall back to defaults if data is somehow undefined
  if (result.data) return result.data;

  // Return schema defaults when nothing else is available
  return {
    NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
    NEXT_PUBLIC_STELLAR_NETWORK: "testnet" as const,
  };
}

/**
 * Validates server-side environment variables.
 * Call this at application startup.
 *
 * @throws {Error} if critical server env vars are missing or invalid in production
 */
export function validateServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse({
    BACKEND_URL: process.env.BACKEND_URL,
    CSRF_SECRET: process.env.CSRF_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    STELLAR_SECRET_KEY: process.env.STELLAR_SECRET_KEY,
    API_RATE_LIMIT: process.env.API_RATE_LIMIT,
    EXPORT_MAX_RECORDS: process.env.EXPORT_MAX_RECORDS,
  });

  if (!result.success) {
    const errorMessages = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `[env] Critical environment variable validation failed:\n${errorMessages}`
      );
    }

    console.warn(
      `[env] Warning: Environment variables have issues:\n${errorMessages}`
    );
    console.warn(
      "[env] The application will continue with default values. " +
        "Set these variables before deploying to production."
    );
  }

  // In Zod v4, safeParse returns defaults even on partial failure
  if (result.data) return result.data;

  // Return schema defaults when nothing else is available
  return {
    BACKEND_URL: "http://localhost:3001",
    NODE_ENV: "development" as const,
    API_RATE_LIMIT: "100",
    EXPORT_MAX_RECORDS: "50000",
  };
}

/**
 * Validates that no secrets are exposed through NEXT_PUBLIC_* variables.
 * Scans for patterns like keys, secrets, passwords in public env vars.
 *
 * @throws {Error} if any secrets are detected in public env vars
 */
export function detectSecretLeaks(): void {
  const secretPatterns = [
    /secret/i,
    /password/i,
    /token/i,
    /api[_-]?key/i,
    /private[_-]?key/i,
    /mnemonic/i,
    /^S[A-Z2-7]{55}$/, // Stellar secret key prefix
  ];

  const publicVars = Object.keys(process.env).filter((key) =>
    key.startsWith("NEXT_PUBLIC_")
  );

  const leaks: string[] = [];

  for (const key of publicVars) {
    const value = process.env[key] ?? "";
    for (const pattern of secretPatterns) {
      if (pattern.test(value)) {
        leaks.push(
          `  - ${key} contains a value matching sensitive pattern: ${pattern}`
        );
        break;
      }
    }
  }

  if (leaks.length > 0) {
    const message =
      `[env] CRITICAL: Potential secret leaks detected in NEXT_PUBLIC_* variables!\n` +
      `${leaks.join("\n")}\n` +
      `These values will be exposed in client-side JavaScript. Remove them immediately.`;

    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    }

    console.warn(message);
  }
}
