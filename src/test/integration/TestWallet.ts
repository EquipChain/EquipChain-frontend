/**
 * TestWallet – a lightweight mock wallet for Playwright integration tests.
 *
 * This class simulates the subset of a Stellar/Freighter wallet that the
 * EquipChain frontend needs:
 *  - Maintaining a deterministic test account address
 *  - Signing transactions (no-op passthrough in tests – the local Quickstart
 *    already funds and accepts the test keypair without real signatures)
 *  - Tracking all transactions that were "submitted" during a test run
 *  - Providing gas cost inspection so integration tests can assert on fee
 *    consumption against the benchmarks in `testConfig.ts`
 *
 * Usage in a spec:
 * ```ts
 * const wallet = new TestWallet(TEST_ADDRESS);
 * await wallet.connect();
 * // … run UI interaction …
 * const gas = wallet.getTotalGasUsed();
 * expect(gas).toBeLessThan(config.gasBenchmarks.registerMeter);
 * wallet.reset();
 * ```
 */

export type MockTransaction = {
  /** XDR envelope of the transaction */
  xdr: string;
  /** Simulated fee in stroops */
  fee: number;
  /** ISO timestamp of the sign call */
  signedAt: string;
};

export class TestWallet {
  /** The Stellar G-address this wallet represents */
  readonly address: string;

  private _connected = false;
  private _transactions: MockTransaction[] = [];

  constructor(address: string) {
    this.address = address;
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * Simulate connecting the wallet.  In real Freighter integration this would
   * trigger the extension popup; here it just flips the connected flag.
   */
  async connect(): Promise<void> {
    this._connected = true;
  }

  /**
   * Simulate disconnecting the wallet.
   */
  async disconnect(): Promise<void> {
    this._connected = false;
  }

  get isConnected(): boolean {
    return this._connected;
  }

  // ─── Signing ───────────────────────────────────────────────────────────────

  /**
   * "Sign" an XDR transaction envelope.
   *
   * For integration tests against the local Quickstart we skip real
   * cryptographic signing – the node accepts any structurally valid
   * transaction from the funded test account.  We do record the call so that
   * gas-cost assertions work.
   *
   * @param xdr - Base64-encoded XDR envelope to sign
   * @param simulatedFee - Fee in stroops to attribute (defaults to 100)
   * @returns The same XDR unchanged
   */
  async signTransaction(xdr: string, simulatedFee = 100): Promise<string> {
    if (!this._connected) {
      throw new Error("TestWallet: call connect() before signTransaction()");
    }
    this._transactions.push({
      xdr,
      fee: simulatedFee,
      signedAt: new Date().toISOString(),
    });
    return xdr;
  }

  // ─── Gas inspection ────────────────────────────────────────────────────────

  /** All transactions signed during the current test run, in order. */
  get transactions(): Readonly<MockTransaction[]> {
    return this._transactions;
  }

  /** Sum of all simulated fees (stroops) across all signed transactions. */
  getTotalGasUsed(): number {
    return this._transactions.reduce((sum, tx) => sum + tx.fee, 0);
  }

  /** Gas used by the most recently signed transaction (0 if none). */
  getLastTransactionGas(): number {
    return this._transactions.at(-1)?.fee ?? 0;
  }

  // ─── Utilities ─────────────────────────────────────────────────────────────

  /**
   * Reset the transaction log.  Call this between individual test cases when
   * reusing the same wallet instance.
   */
  reset(): void {
    this._transactions = [];
  }

  /**
   * Convenience factory: creates a connected wallet for the standard test
   * account address defined in `testConfig.ts`.
   */
  static async fromTestConfig(address: string): Promise<TestWallet> {
    const wallet = new TestWallet(address);
    await wallet.connect();
    return wallet;
  }
}
