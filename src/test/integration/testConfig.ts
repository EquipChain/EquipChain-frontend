/**
 * Integration test configuration.
 *
 * All values default to the local Stellar Quickstart container defined in
 * docker-compose.test.yml.  Override via environment variables when targeting
 * the public Soroban testnet or a custom deployment.
 */

export type IntegrationTestConfig = {
  /** Base URL of the running Next.js app under test */
  baseUrl: string;
  /** EquipChain backend REST API root (optional – skipped when absent) */
  backendUrl?: string;
  /** Soroban RPC endpoint used to deploy and query contracts */
  sorobanRpcUrl?: string;
  /** Stellar network passphrase */
  networkPassphrase: string;
  /** Pre-funded test account keypair (secret key MUST NOT be a real account) */
  testAccountSecret: string;
  /** Contract IDs populated after `deployTestContracts()` runs */
  contractIds: {
    meterRegistry?: string;
    streamManager?: string;
    billingLedger?: string;
  };
  /** How long (ms) to poll for Soroban transaction confirmation */
  txConfirmationTimeout: number;
  /** Gas cost benchmark thresholds (stroops).  Failing above these values is a warning. */
  gasBenchmarks: {
    registerMeter: number;
    createStream: number;
    submitReading: number;
    processBilling: number;
  };
};

/**
 * Build the integration test config from environment variables with safe
 * fallbacks for the local Quickstart setup.
 */
export function getIntegrationTestConfig(): IntegrationTestConfig {
  return {
    baseUrl: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    backendUrl: process.env.BACKEND_URL,
    sorobanRpcUrl:
      process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? "http://127.0.0.1:8000/rpc",
    // Local Quickstart passphrase; real testnet uses "Test SDF Network ; September 2015"
    networkPassphrase:
      process.env.STELLAR_NETWORK_PASSPHRASE ??
      "Standalone Network ; February 2017",
    // This is a well-known Quickstart test account secret – safe to embed.
    testAccountSecret:
      process.env.TEST_ACCOUNT_SECRET ??
      "SCZANGBA5IOEFH7OIUDBMQK3JXUKV5D3LTPNRKHLKX7X3KKQFGCZ9US",
    contractIds: {
      meterRegistry: process.env.CONTRACT_ID_METER_REGISTRY,
      streamManager: process.env.CONTRACT_ID_STREAM_MANAGER,
      billingLedger: process.env.CONTRACT_ID_BILLING_LEDGER,
    },
    // Blockchain confirmations can take up to 30 seconds on testnet
    txConfirmationTimeout: Number(
      process.env.TX_CONFIRMATION_TIMEOUT ?? "30000"
    ),
    gasBenchmarks: {
      registerMeter: Number(
        process.env.GAS_BENCHMARK_REGISTER_METER ?? "1000000"
      ),
      createStream: Number(process.env.GAS_BENCHMARK_CREATE_STREAM ?? "800000"),
      submitReading: Number(
        process.env.GAS_BENCHMARK_SUBMIT_READING ?? "600000"
      ),
      processBilling: Number(
        process.env.GAS_BENCHMARK_PROCESS_BILLING ?? "1200000"
      ),
    },
  };
}
