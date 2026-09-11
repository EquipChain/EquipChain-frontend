import type {
  DataStream,
  DashboardSummary,
  Invoice,
  Meter,
} from "@/src/lib/types/domain";
import { RATE_BY_UTILITY, UNIT_BY_UTILITY } from "@/src/lib/types/domain";

// ============================================================================
// Fixtures — typed demo data standing in for the backend API
// ============================================================================
// Every page hard-codes its own literal array with stringified numbers and
// dates ("125,000 kWh", "2024-03-15"), so the same meter appears with
// different names/values on different pages and the shapes are incompatible
// with the existing test factories. These fixtures use the canonical domain
// types with real number/ISO-date fields, and are what the SWR API layer
// serves until the EquipChain backend integration lands.

export const sampleMeters: Meter[] = [
  {
    id: "meter-001",
    name: "Main Building",
    type: "Electric",
    status: "Active",
    lastReading: 15420,
    totalConsumption: 125000,
    rate: RATE_BY_UTILITY.Electric,
    lastUpdated: "2026-03-15T14:32:00Z",
    ownerAddress: "GABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHJKLM",
    registeredAt: "2026-01-01T00:00:00Z",
    location: "Building A — Ground Floor",
  },
  {
    id: "meter-002",
    name: "Warehouse A",
    type: "Water",
    status: "Active",
    lastReading: 8250,
    totalConsumption: 92000,
    rate: RATE_BY_UTILITY.Water,
    lastUpdated: "2026-03-15T14:30:00Z",
    ownerAddress: "GBCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMN",
    registeredAt: "2026-01-15T00:00:00Z",
    location: "Warehouse row 3",
  },
  {
    id: "meter-003",
    name: "Office Floor 2",
    type: "Gas",
    status: "Inactive",
    lastReading: 3100,
    totalConsumption: 45000,
    rate: RATE_BY_UTILITY.Gas,
    lastUpdated: "2026-03-14T09:15:00Z",
    ownerAddress: "GNCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOP",
    registeredAt: "2026-02-01T00:00:00Z",
    location: "Office — Floor 2",
  },
];

export const sampleInvoices: Invoice[] = [
  {
    id: "INV-2026-001",
    meterId: "meter-001",
    periodStart: "2026-02-01",
    periodEnd: "2026-02-28",
    consumption: 12450,
    rate: RATE_BY_UTILITY.Electric,
    amount: 1494,
    status: "Paid",
    dueDate: "2026-03-01",
    paidAt: "2026-02-27T16:05:00Z",
  },
  {
    id: "INV-2026-002",
    meterId: "meter-002",
    periodStart: "2026-02-01",
    periodEnd: "2026-02-28",
    consumption: 8200,
    rate: RATE_BY_UTILITY.Water,
    amount: 410,
    status: "Pending",
    dueDate: "2026-03-05",
  },
  {
    id: "INV-2026-003",
    meterId: "meter-003",
    periodStart: "2026-02-01",
    periodEnd: "2026-02-28",
    consumption: 3050,
    rate: RATE_BY_UTILITY.Gas,
    amount: 244,
    status: "Overdue",
    dueDate: "2026-03-01",
  },
];

export const sampleStreams: DataStream[] = [
  {
    id: "stream-001",
    meterId: "meter-001",
    type: "Real-time",
    flowRate: 1.2,
    status: "Streaming",
    lastDataAt: "2026-03-15T14:32:00Z",
    uptime: 99.8,
    startedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "stream-002",
    meterId: "meter-002",
    type: "Batch",
    flowRate: 0.8,
    status: "Streaming",
    lastDataAt: "2026-03-15T14:30:00Z",
    uptime: 99.5,
    startedAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "stream-003",
    meterId: "meter-003",
    type: "Real-time",
    flowRate: 0.5,
    status: "Paused",
    lastDataAt: "2026-03-14T09:15:00Z",
    uptime: 87.3,
    startedAt: "2026-02-01T00:00:00Z",
  },
];

export const sampleDashboardSummary: DashboardSummary = {
  activeMeters: 2,
  totalMeters: 3,
  totalConsumption: sampleMeters.reduce(
    (sum, meter) => sum + meter.totalConsumption,
    0
  ),
  activeStreams: 2,
  pendingInvoices: 1,
  overdueInvoices: 1,
  gasBuffer: 45.2,
  monthlySpend: 1245.8,
};

/** Unit label for a meter, derived from its utility type. */
export function meterUnit(meter: Meter): string {
  return UNIT_BY_UTILITY[meter.type];
}
