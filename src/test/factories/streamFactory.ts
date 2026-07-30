/**
 * streamFactory – generates realistic data-stream test-data objects.
 */

export type StreamStatus = "Streaming" | "Paused" | "Stopped";
export type StreamType = "Real-time" | "Batch";

export type Stream = {
  id: string;
  meterId: string;
  name: string;
  type: StreamType;
  flowRate: string;
  status: StreamStatus;
  lastData: string;
  uptime: string;
  startedAt: string;
  /** Simulated Soroban contract ID that manages this stream */
  contractId?: string;
};

export type StreamFactoryInput = {
  id?: string;
  meterId?: string;
  name?: string;
  type?: StreamType;
  flowRate?: string;
  status?: StreamStatus;
  lastData?: string;
  uptime?: string;
  startedAt?: string;
  contractId?: string;
};

const STREAM_TYPES: StreamType[] = ["Real-time", "Batch"];
const STREAM_STATUSES: StreamStatus[] = ["Streaming", "Paused", "Stopped"];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatUptime(pct: number): string {
  return `${pct.toFixed(1)}%`;
}

/** Produce a single stream record with sensible defaults. */
export function streamFactory(input: StreamFactoryInput = {}): Stream {
  const id =
    input.id ?? `stream-${String(randomInt(1, 999)).padStart(3, "0")}`;
  const type = input.type ?? STREAM_TYPES[randomInt(0, 1)]!;
  const status = input.status ?? STREAM_STATUSES[0]!; // default Streaming
  const uptime = randomInt(850, 999) / 10; // 85.0 – 99.9 %

  const now = new Date();
  const lastDataDate = new Date(now.getTime() - randomInt(1, 30) * 60 * 1000);

  return {
    id,
    meterId: input.meterId ?? "meter-001",
    name: input.name ?? `Stream ${id}`,
    type,
    flowRate:
      input.flowRate ??
      `${(randomInt(5, 20) / 10).toFixed(1)} kWh/min`,
    status,
    lastData:
      input.lastData ??
      lastDataDate.toISOString().replace("T", " ").slice(0, 16),
    uptime: input.uptime ?? formatUptime(uptime),
    startedAt:
      input.startedAt ?? new Date(now.getTime() - randomInt(1, 180) * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
    contractId: input.contractId,
  };
}

/**
 * Produce an array of `count` streams, all linked to the same meter.
 */
export function streamBatch(
  count: number,
  meterId = "meter-001",
  sharedInput: StreamFactoryInput = {}
): Stream[] {
  return Array.from({ length: count }, (_, i) =>
    streamFactory({
      id: `stream-${String(i + 1).padStart(3, "0")}`,
      meterId,
      ...sharedInput,
    })
  );
}
