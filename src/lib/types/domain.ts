// ============================================================================
// Domain Types — canonical entity shapes for meters, streams, and billing
// ============================================================================
// Pages currently define mutually-incompatible anonymous row shapes
// (MeterRow in meters/page.client.tsx, BillingRow in billing, StreamRow in
// streams) with string-typed numbers and dates. These types are the single
// source of truth that fixtures, the API layer, and eventually real backend
// responses will share, so numeric/date fields carry real types instead of
// presentation-coupled strings.

/** Utility categories tracked by the platform. */
export type UtilityType = "Electric" | "Water" | "Gas";

/** Operational status of a meter. */
export type MeterStatus = "Active" | "Inactive" | "Maintenance" | "Offline";

/** A utility meter registered on the EquipChain smart contracts. */
export interface Meter {
  id: string;
  name: string;
  type: UtilityType;
  status: MeterStatus;
  /** Latest cumulative reading in the meter's native unit */
  lastReading: number;
  /** Lifetime consumption in the meter's native unit */
  totalConsumption: number;
  /** Billing rate per unit, in the meter's currency */
  rate: number;
  /** ISO 8601 timestamp of the most recent reading */
  lastUpdated: string;
  /** Stellar public key of the meter owner (G... 56 chars) */
  ownerAddress: string;
  /** ISO 8601 registration timestamp */
  registeredAt: string;
  location?: string;
}

/** Lifecycle of a payment. */
export type PaymentStatus = "Paid" | "Pending" | "Overdue" | "Failed";

/** An invoice generated from meter consumption over a billing period. */
export interface Invoice {
  id: string;
  meterId: string;
  /** ISO 8601 period start (inclusive) */
  periodStart: string;
  /** ISO 8601 period end (inclusive) */
  periodEnd: string;
  /** Consumption in the meter's unit for this period */
  consumption: number;
  /** Rate per unit applied for this period */
  rate: number;
  /** Total amount due in USD */
  amount: number;
  status: PaymentStatus;
  /** ISO 8601 payment deadline */
  dueDate: string;
  /** ISO 8601 settlement time, set once Paid */
  paidAt?: string;
}

/** Delivery mode of a meter data stream. */
export type StreamType = "Real-time" | "Batch";

/** Health of a meter data stream. */
export type StreamStatus = "Streaming" | "Paused" | "Failed" | "Offline";

/** A live or batched feed of readings coming off a meter. */
export interface DataStream {
  id: string;
  meterId: string;
  type: StreamType;
  /** Consumption rate in the meter's unit per minute */
  flowRate: number;
  status: StreamStatus;
  /** ISO 8601 timestamp of the most recent data point */
  lastDataAt: string;
  /** Uptime percentage, 0–100 */
  uptime: number;
  /** ISO 8601 stream creation timestamp */
  startedAt: string;
}

/** Dashboard-level aggregates for the overview cards. */
export interface DashboardSummary {
  activeMeters: number;
  totalMeters: number;
  /** Total consumption across all meters, kWh-equivalent */
  totalConsumption: number;
  activeStreams: number;
  pendingInvoices: number;
  overdueInvoices: number;
  /** Gas buffer balance in XLM */
  gasBuffer: number;
  /** Projected monthly spend in USD */
  monthlySpend: number;
}

/**
 * Unit of measurement per utility type. Used by formatters and charts to
 * label quantities correctly.
 */
export const UNIT_BY_UTILITY: Record<UtilityType, string> = {
  Electric: "kWh",
  Water: "gal",
  Gas: "m³",
};

/**
 * Default billing rate per unit per utility type, USD. Mirrors the rate
 * constants used by the test factories.
 */
export const RATE_BY_UTILITY: Record<UtilityType, number> = {
  Electric: 0.12,
  Water: 0.05,
  Gas: 0.08,
};
