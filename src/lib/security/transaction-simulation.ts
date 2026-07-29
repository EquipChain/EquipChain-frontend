// ============================================================================
// Transaction Simulation Utility
// Simulates Stellar Soroban transactions before user signing to preview
// the effects of a transaction (cost, state changes, errors).
// ============================================================================

// Env types are referenced via the validation schemas

/**
 * Result of a transaction simulation
 */
export interface SimulationResult {
  /** Whether the simulation succeeded */
  success: boolean;
  /** Human-readable summary of what the transaction will do */
  summary: string;
  /** Estimated XLM cost (including fees) */
  estimatedCost: string;
  /** Estimated resource fees (CPU, RAM, ledger reads/writes) */
  resourceFees: {
    cpuInstructions: string;
    ram: string;
    ledgerReads: number;
    ledgerWrites: number;
  };
  /** State changes the transaction will make */
  stateChanges: Array<{
    contractId: string;
    key: string;
    oldValue?: string;
    newValue: string;
  }>;
  /** Events that will be emitted */
  events: Array<{
    contractId: string;
    topics: string[];
    data: string;
  }>;
  /** Error details if simulation failed */
  error?: {
    code: string;
    message: string;
  };
  /** Whether the simulation is from a live RPC or a client-side estimate */
  source: "rpc" | "estimate";
}

/**
 * Options for transaction simulation
 */
export interface SimulationOptions {
  /** The base64-encoded XDR transaction envelope */
  transactionXdr: string;
  /** The source account address */
  sourceAccount: string;
  /** The Soroban RPC URL (defaults to env var) */
  rpcUrl?: string;
  /** Network passphrase */
  networkPassphrase: string;
}

// ============================================================================
// Simulation Helpers
// ============================================================================

/**
 * Parses a Stellar transaction XDR and extracts human-readable information.
 * This is a simplified client-side parser that extracts key details without
 * requiring the full Stellar SDK.
 *
 * In production, this would use @stellar/stellar-sdk TransactionBuilder to
 * parse the XDR fully and make an RPC call to simulateTransaction.
 */
function parseTransactionXdr(xdr: string): {
  operations: Array<{ type: string; description: string }>;
  sourceAccount: string;
  fee: string;
} {
  // Decode base64 XDR to string for basic pattern matching
  let decoded: string;
  try {
    decoded = Buffer.from(xdr, "base64").toString("binary");
  } catch {
    return {
      operations: [{ type: "unknown", description: "Could not decode transaction" }],
      sourceAccount: "",
      fee: "0",
    };
  }

  const operations: Array<{ type: string; description: string }> = [];

  // Detect operation types from the XDR patterns
  if (decoded.includes("payment")) {
    operations.push({
      type: "payment",
      description: "Send payment (XLM or token transfer)",
    });
  }
  if (decoded.includes("createAccount") || decoded.includes("CreateAccount")) {
    operations.push({
      type: "createAccount",
      description: "Create a new Stellar account",
    });
  }
  if (decoded.includes("manageBuyOffer") || decoded.includes("manageSellOffer")) {
    operations.push({
      type: "manageOffer",
      description: "Create or update a DEX offer",
    });
  }
  if (decoded.includes("changeTrust") || decoded.includes("ChangeTrust")) {
    operations.push({
      type: "changeTrust",
      description: "Modify trustline for an asset",
    });
  }
  if (decoded.includes("setOptions") || decoded.includes("SetOptions")) {
    operations.push({
      type: "setOptions",
      description: "Update account options (signers, thresholds)",
    });
  }
  if (
    decoded.includes("invokeHostFunction") ||
    decoded.includes("InvokeHostFunction")
  ) {
    // Soroban contract invocation
    operations.push({
      type: "invokeContract",
      description: "Invoke a Soroban smart contract function",
    });
  }

  if (operations.length === 0) {
    operations.push({
      type: "unknown",
      description: "Unknown operation type — verify transaction details carefully",
    });
  }

  return {
    operations,
    sourceAccount: "",
    fee: "0.00001 XLM",
  };
}

// ============================================================================
// Main Simulation Function
// ============================================================================

/**
 * Simulates a Stellar/Soroban transaction and returns a human-readable preview.
 *
 * This implementation provides client-side estimation when no Soroban RPC is
 * available. In production with a live RPC endpoint, it would call
 * `rpc.simulateTransaction()` for accurate resource fee and state change data.
 *
 * @param options - Transaction simulation options
 * @returns Simulation result with costs, state changes, and summary
 */
export async function simulateTransaction(
  options: SimulationOptions
): Promise<SimulationResult> {
  const { transactionXdr, rpcUrl } = options;

  // Validate transaction envelope
  if (!transactionXdr || transactionXdr.length === 0) {
    return {
      success: false,
      summary: "Invalid transaction: empty envelope",
      estimatedCost: "0",
      resourceFees: { cpuInstructions: "0", ram: "0", ledgerReads: 0, ledgerWrites: 0 },
      stateChanges: [],
      events: [],
      error: { code: "INVALID_ENVELOPE", message: "Transaction envelope is empty" },
      source: "estimate",
    };
  }

  // Parse the transaction for basic information
  const parsed = parseTransactionXdr(transactionXdr);

  try {
    // Attempt live RPC simulation if URL is available
    if (rpcUrl) {
      return await simulateViaRpc(options, parsed);
    }
  } catch (rpcError) {
    console.warn(
      "[tx-simulation] RPC simulation failed, falling back to estimate:",
      rpcError
    );
  }

  // Fall back to client-side estimate
  return createEstimate(options, parsed);
}

// ============================================================================
// RPC Simulation
// ============================================================================

async function simulateViaRpc(
  options: SimulationOptions,
  parsed: ReturnType<typeof parseTransactionXdr>
): Promise<SimulationResult> {
  const { transactionXdr, rpcUrl } = options;

  const response = await fetch(rpcUrl!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "simulateTransaction",
      params: {
        transaction: transactionXdr,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`RPC returned ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.error) {
    return {
      success: false,
      summary: `Transaction simulation failed: ${result.error.message ?? "Unknown error"}`,
      estimatedCost: "0",
      resourceFees: { cpuInstructions: "0", ram: "0", ledgerReads: 0, ledgerWrites: 0 },
      stateChanges: [],
      events: [],
      error: {
        code: result.error.code ?? "SIMULATION_ERROR",
        message: result.error.message ?? "Unknown simulation error",
      },
      source: "rpc",
    };
  }

  const simResult = result.result;
  const fees = simResult.cost ?? {};

  // Build state changes from simulation result
  const stateChanges: SimulationResult["stateChanges"] = [];
  if (simResult.stateChanges) {
    for (const change of simResult.stateChanges) {
      stateChanges.push({
        contractId: change.contractId ?? "unknown",
        key: change.key ?? "unknown",
        oldValue: change.oldValue,
        newValue: change.newValue ?? "",
      });
    }
  }

  // Build events from simulation result
  const events: SimulationResult["events"] = [];
  if (simResult.events) {
    for (const event of simResult.events) {
      events.push({
        contractId: event.contractId ?? "unknown",
        topics: event.topic ?? [],
        data: event.data ?? "",
      });
    }
  }

  const estimatedCost = formatCost(
    fees.cpuInsns ?? "0",
    fees.ram ?? "0",
    fees.ledgerReads ?? 0,
    fees.ledgerWrites ?? 0
  );

  return {
    success: true,
    summary: buildSummary(parsed.operations, true),
    estimatedCost,
    resourceFees: {
      cpuInstructions: String(fees.cpuInsns ?? "0"),
      ram: String(fees.ram ?? "0"),
      ledgerReads: fees.ledgerReads ?? 0,
      ledgerWrites: fees.ledgerWrites ?? 0,
    },
    stateChanges,
    events,
    source: "rpc",
  };
}

// ============================================================================
// Client-Side Estimate (fallback when no RPC available)
// ============================================================================

function createEstimate(
  options: SimulationOptions,
  parsed: ReturnType<typeof parseTransactionXdr>
): SimulationResult {
  const opCount = parsed.operations.length;

  // Rough estimate: each operation costs ~100 stroops
  // 1 XLM = 10,000,000 stroops
  const estimatedStroops = 100 + opCount * 100;
  const estimatedXlm = estimatedStroops / 10_000_000;

  return {
    success: true,
    summary: buildSummary(parsed.operations, false),
    estimatedCost: `${estimatedXlm.toFixed(6)} XLM (estimate)`,
    resourceFees: {
      cpuInstructions: "~1000",
      ram: "~256 bytes",
      ledgerReads: opCount * 2,
      ledgerWrites: opCount,
    },
    stateChanges: [],
    events: [],
    source: "estimate",
  };
}

// ============================================================================
// Formatting Helpers
// ============================================================================

function buildSummary(
  operations: Array<{ type: string; description: string }>,
  fromRpc: boolean
): string {
  const prefix = fromRpc ? "Simulated" : "Estimated";

  if (operations.length === 1) {
    return `${prefix}: ${operations[0].description}`;
  }

  const opDescriptions = operations.map((op) => op.description).join("; ");
  return `${prefix} ${operations.length} operations: ${opDescriptions}`;
}

function formatCost(
  cpuInsns: string,
  ram: string,
  reads: number,
  writes: number
): string {
  // Convert resource usage to approximate XLM cost
  // These are rough estimates based on Soroban fee structure
  const cpuCost = (Number(cpuInsns) / 1_000_000) * 0.000001;
  const ramCost = (Number(ram) / 1024) * 0.000001;
  const ioCost = (reads * 0.000001) + (writes * 0.000002);

  const total = cpuCost + ramCost + ioCost + 0.0001; // Base fee

  return `${total.toFixed(6)} XLM`;
}
