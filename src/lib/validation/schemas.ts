import { z } from "zod";

// ============================================================================
// Stellar Address Validation
// Stellar public keys start with 'G' and are 56 characters with a checksum
// ============================================================================

/** Validates a Stellar public key (G... 56 chars, base32 with checksum) */
export const stellarAddressSchema = z
  .string()
  .min(1, "Stellar address is required")
  .regex(
    /^G[A-Z2-7]{55}$/,
    "Invalid Stellar address format. Must start with 'G' followed by 55 alphanumeric characters (base32)."
  );

/** Validates a Stellar secret key (S... 56 chars) */
export const stellarSecretSchema = z
  .string()
  .min(1, "Secret key is required")
  .regex(
    /^S[A-Z2-7]{55}$/,
    "Invalid Stellar secret key format. Must start with 'S' followed by 55 alphanumeric characters (base32)."
  );

/** Validates a Stellar contract ID (C... 56 chars) */
export const stellarContractIdSchema = z
  .string()
  .min(1, "Contract ID is required")
  .regex(
    /^C[A-Z2-7]{55}$/,
    "Invalid contract ID format. Must start with 'C' followed by 55 alphanumeric characters (base32)."
  );

// ============================================================================
// Amount & Rate Validation
// ============================================================================

/** Validates a positive numeric amount (e.g., token amounts, balances) */
export const amountSchema = z
  .string()
  .min(1, "Amount is required")
  .refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Amount must be a positive number."
  )
  .transform((val) => val);

/** Validates a rate value (non-negative number) */
export const rateSchema = z
  .string()
  .min(1, "Rate is required")
  .refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 0,
    "Rate must be a non-negative number."
  )
  .transform((val) => val);

/** Validates a percentage value (0-100) */
export const percentageSchema = z
  .number()
  .min(0, "Percentage must be at least 0")
  .max(100, "Percentage must be at most 100");

// ============================================================================
// Meter Validation
// ============================================================================

/** Validates a meter ID format */
export const meterIdSchema = z
  .string()
  .min(1, "Meter ID is required")
  .max(64, "Meter ID must be at most 64 characters")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Meter ID must contain only letters, numbers, hyphens, and underscores."
  );

/** Validates meter registration form data */
export const meterRegistrationSchema = z.object({
  meterId: meterIdSchema,
  initialReading: amountSchema,
  rate: rateSchema,
  ownerAddress: stellarAddressSchema,
});

/** Validates meter reading submission */
export const meterReadingSchema = z.object({
  meterId: meterIdSchema,
  reading: amountSchema,
  timestamp: z.number().int().positive("Timestamp must be a positive integer"),
  signature: z.string().optional(),
});

// ============================================================================
// Billing Validation
// ============================================================================

/** Validates billing period dates */
export const billingPeriodSchema = z
  .object({
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Start date must be a valid date string",
    }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "End date must be a valid date string",
    }),
  })
  .refine(
    (data) => new Date(data.startDate) < new Date(data.endDate),
    "Start date must be before end date"
  );

/** Validates a billing record */
export const billingRecordSchema = z.object({
  meterId: meterIdSchema,
  period: billingPeriodSchema,
  consumption: amountSchema,
  rate: rateSchema,
  totalAmount: amountSchema,
});

// ============================================================================
// Transaction Validation
// ============================================================================

/** Validates a Stellar transaction envelope (base64 XDR) */
export const transactionEnvelopeSchema = z
  .string()
  .min(1, "Transaction envelope is required")
  .regex(
    /^[A-Za-z0-9+/]+=*$/,
    "Transaction envelope must be a valid base64-encoded XDR string"
  );

/** Validates transaction simulation request */
export const transactionSimulationSchema = z.object({
  transaction: transactionEnvelopeSchema,
  sourceAccount: stellarAddressSchema,
  networkPassphrase: z.string().min(1),
});

// ============================================================================
// Wallet Origin Validation
// ============================================================================

/** Known trusted wallet extension origins for Stellar */
export const TRUSTED_WALLET_ORIGINS = [
  "https://freighter.app",
  "https://albedo.link",
  "https://rabet.io",
  "https://lobstr.co",
  "https://xbull.app",
] as const;

/** Validates wallet connection origin */
export const walletOriginSchema = z
  .string()
  .url("Wallet origin must be a valid URL")
  .refine(
    (origin) => {
      // In development, allow localhost
      if (process.env.NODE_ENV === "development") {
        return origin.startsWith("http://localhost");
      }
      return TRUSTED_WALLET_ORIGINS.some(
        (trusted) => origin.startsWith(trusted)
      );
    },
    {
      message:
        "Wallet connection origin is not from a trusted provider. Allowed: Freighter, Albedo, Rabet, Lobstr, xBull.",
    }
  );

// ============================================================================
// General Input Validation Helpers
// ============================================================================

/** Validates a generic string input for XSS prevention */
export const safeStringSchema = z
  .string()
  .max(1000, "Input must be at most 1000 characters")
  .refine(
    (val) => !/<script[^>]*>.*?<\/script>/gi.test(val),
    "Input contains potentially unsafe content"
  )
  .refine(
    (val) => !/on\w+\s*=\s*["'][^"']*["']/gi.test(val),
    "Input contains potentially unsafe event handlers"
  );

/** Validates an email address */
export const emailSchema = z
  .string()
  .email("Invalid email address format")
  .max(254, "Email must be at most 254 characters");

/** Validates a URL */
export const urlSchema = z
  .string()
  .url("Invalid URL format")
  .max(2048, "URL must be at most 2048 characters");

/** Validates export configuration */
export const exportConfigSchema = z.object({
  format: z.enum(["csv", "json", "pdf"] as const, {
    error: "Format must be csv, json, or pdf",
  }),
  columns: z.array(z.string()).min(1, "At least one column must be selected"),
  dateRange: billingPeriodSchema.optional(),
  aggregation: z.enum(["none", "daily", "weekly", "monthly"]).default("none"),
  dataType: z.enum(["meters", "streams", "billing", "transactions"]),
});

// ============================================================================
// Type Exports
// ============================================================================

export type StellarAddress = z.infer<typeof stellarAddressSchema>;
export type MeterId = z.infer<typeof meterIdSchema>;
export type MeterRegistration = z.infer<typeof meterRegistrationSchema>;
export type MeterReading = z.infer<typeof meterReadingSchema>;
export type BillingPeriod = z.infer<typeof billingPeriodSchema>;
export type BillingRecord = z.infer<typeof billingRecordSchema>;
export type TransactionEnvelope = z.infer<typeof transactionEnvelopeSchema>;
export type TransactionSimulation = z.infer<typeof transactionSimulationSchema>;
export type ExportConfig = z.infer<typeof exportConfigSchema>;
export type SafeString = z.infer<typeof safeStringSchema>;
