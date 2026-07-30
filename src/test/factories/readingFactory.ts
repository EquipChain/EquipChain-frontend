/**
 * readingFactory – generates realistic meter-reading test-data objects.
 */

export type Reading = {
  meterId: string;
  value: number;
  unit: string;
  timestamp: string;
  /** Simulated on-chain transaction ID (hex string) */
  txHash?: string;
};

export type ReadingFactoryInput = {
  meterId?: string;
  value?: number;
  unit?: string;
  timestamp?: string;
  txHash?: string;
};

function randomFloat(min: number, max: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

function randomHex(bytes = 32): string {
  return Array.from({ length: bytes }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0")
  ).join("");
}

/** Produce a single reading record. */
export function readingFactory(input: ReadingFactoryInput = {}): Reading {
  return {
    meterId: input.meterId ?? "meter-001",
    value: input.value ?? randomFloat(10, 500),
    unit: input.unit ?? "kWh",
    timestamp: input.timestamp ?? new Date().toISOString(),
    txHash: input.txHash ?? randomHex(),
  };
}

/**
 * Generate a time-series of readings for a single meter.
 *
 * @param count - Number of readings to generate
 * @param meterId - Meter to associate readings with
 * @param intervalHours - Hours between consecutive readings (default 1)
 */
export function readingTimeSeries(
  count: number,
  meterId = "meter-001",
  intervalHours = 1
): Reading[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const ts = new Date(
      now.getTime() - (count - 1 - i) * intervalHours * 60 * 60 * 1000
    );
    return readingFactory({
      meterId,
      timestamp: ts.toISOString(),
    });
  });
}
