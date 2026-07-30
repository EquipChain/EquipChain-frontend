/**
 * meterFactory – generates realistic meter test-data objects.
 *
 * Generates deterministic or random meter records that match the shape
 * expected by the EquipChain backend and UI.
 */

export type MeterStatus = "Active" | "Inactive" | "Maintenance";
export type MeterType = "Electric" | "Water" | "Gas";

export type Meter = {
  id: string;
  name: string;
  type: MeterType;
  status: MeterStatus;
  lastReading: string;
  totalConsumption: string;
  rate: string;
  lastUpdated: string;
  ownerAddress: string;
};

export type MeterFactoryInput = {
  id?: string;
  name?: string;
  type?: MeterType;
  status?: MeterStatus;
  lastReading?: string;
  totalConsumption?: string;
  rate?: string;
  lastUpdated?: string;
  ownerAddress?: string;
};

const METER_TYPES: MeterType[] = ["Electric", "Water", "Gas"];
const METER_STATUSES: MeterStatus[] = ["Active", "Inactive", "Maintenance"];

const UNIT_BY_TYPE: Record<MeterType, string> = {
  Electric: "kWh",
  Water: "gal",
  Gas: "m³",
};

const RATE_BY_TYPE: Record<MeterType, string> = {
  Electric: "$0.12/kWh",
  Water: "$0.05/gal",
  Gas: "$0.08/m³",
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Produce a single meter record with sensible defaults. */
export function meterFactory(input: MeterFactoryInput = {}): Meter {
  const type = input.type ?? METER_TYPES[randomInt(0, 2)]!;
  const unit = UNIT_BY_TYPE[type];
  const lastReadingValue = randomInt(1_000, 20_000).toLocaleString();
  const totalConsumptionValue = randomInt(50_000, 200_000).toLocaleString();

  const id = input.id ?? `meter-${String(randomInt(1, 999)).padStart(3, "0")}`;

  return {
    id,
    name: input.name ?? `Test Meter ${id}`,
    type,
    status: input.status ?? METER_STATUSES[randomInt(0, 1)]!, // weighted toward Active/Inactive
    lastReading: input.lastReading ?? `${lastReadingValue} ${unit}`,
    totalConsumption:
      input.totalConsumption ?? `${totalConsumptionValue} ${unit}`,
    rate: input.rate ?? RATE_BY_TYPE[type],
    lastUpdated: input.lastUpdated ?? new Date().toISOString().slice(0, 10),
    ownerAddress:
      input.ownerAddress ??
      "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
  };
}

/**
 * Produce an array of `count` meters.  Optionally override shared fields for
 * all records via `sharedInput`.
 */
export function meterBatch(
  count: number,
  sharedInput: MeterFactoryInput = {}
): Meter[] {
  return Array.from({ length: count }, (_, i) =>
    meterFactory({ id: `meter-${String(i + 1).padStart(3, "0")}`, ...sharedInput })
  );
}
