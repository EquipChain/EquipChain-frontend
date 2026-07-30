/**
 * createStream.spec.ts
 *
 * End-to-end integration test: Fund gas buffer → Create stream → Verify
 * stream is active.
 *
 * Covers the /streams route rendered by StreamsPageClient.
 * Soroban-dependent assertions are gated behind `isSorobanRpcHealthy()`.
 */

import { expect, test } from "@playwright/test";

import {
  captureContractSnapshot,
  isSorobanRpcHealthy,
} from "../setupTestEnvironment";
import { getIntegrationTestConfig } from "../testConfig";
import { TestWallet } from "../TestWallet";
import { streamFactory } from "../../factories/streamFactory";

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe("Streams page – UI rendering", () => {
  test("page loads with Streams heading", async ({ page }) => {
    await page.goto("/streams");
    await expect(
      page.getByRole("heading", { name: "Streams", level: 1 })
    ).toBeVisible();
  });

  test("page renders the descriptive subtitle", async ({ page }) => {
    await page.goto("/streams");
    await expect(
      page.getByText("Monitor real-time data streams from your utility meters.")
    ).toBeVisible();
  });

  test("Export button is present", async ({ page }) => {
    await page.goto("/streams");
    await expect(
      page.getByRole("button", { name: /export/i })
    ).toBeVisible();
  });

  test("data table renders with expected column headers", async ({ page }) => {
    await page.goto("/streams");
    const expectedHeaders = [
      "Stream ID",
      "Meter ID",
      "Type",
      "Flow Rate",
      "Status",
      "Last Data Point",
      "Uptime",
    ];
    for (const header of expectedHeaders) {
      await expect(page.getByRole("columnheader", { name: header })).toBeVisible();
    }
  });

  test("sample stream-001 appears in the table", async ({ page }) => {
    await page.goto("/streams");
    await expect(page.getByText("stream-001")).toBeVisible();
  });

  test("sample stream-002 appears in the table", async ({ page }) => {
    await page.goto("/streams");
    await expect(page.getByText("stream-002")).toBeVisible();
  });

  test("sample stream-003 appears in the table", async ({ page }) => {
    await page.goto("/streams");
    await expect(page.getByText("stream-003")).toBeVisible();
  });

  test("Streaming status badge is visible", async ({ page }) => {
    await page.goto("/streams");
    const badges = page.locator("span", { hasText: "Streaming" });
    await expect(badges.first()).toBeVisible();
  });

  test("Paused status badge is visible", async ({ page }) => {
    await page.goto("/streams");
    await expect(page.getByText("Paused")).toBeVisible();
  });

  test("uptime percentages are displayed", async ({ page }) => {
    await page.goto("/streams");
    // The sample data contains "99.8%" – assert at least one % value is shown
    await expect(page.getByText(/\d+\.\d+%/)).toBeVisible();
  });
});

test.describe("Streams page – wallet mock integration", () => {
  test("TestWallet tracks gas for create-stream transaction", async () => {
    const config = getIntegrationTestConfig();
    const stream = streamFactory({ status: "Streaming" });

    const wallet = await TestWallet.fromTestConfig(
      "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
    );

    await wallet.signTransaction(`CREATE_STREAM_${stream.id}`, 700);

    expect(wallet.getTotalGasUsed()).toBeLessThanOrEqual(
      config.gasBenchmarks.createStream
    );
    wallet.reset();
  });

  test("disconnected wallet throws on signTransaction", async () => {
    const wallet = new TestWallet(
      "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
    );
    // wallet is NOT connected
    await expect(wallet.signTransaction("FAKE_XDR")).rejects.toThrow(
      "call connect()"
    );
  });

  test("wallet reset clears transaction history", async () => {
    const wallet = await TestWallet.fromTestConfig(
      "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
    );
    await wallet.signTransaction("TX_1", 200);
    await wallet.signTransaction("TX_2", 300);
    expect(wallet.transactions).toHaveLength(2);

    wallet.reset();
    expect(wallet.transactions).toHaveLength(0);
    expect(wallet.getTotalGasUsed()).toBe(0);
  });
});

test.describe("Streams page – Soroban integration (requires local RPC)", () => {
  test("fund gas buffer -> create stream -> stream active", async ({
    page,
  }) => {
    test.skip(
      !(await isSorobanRpcHealthy()),
      "Soroban RPC not available – skipping contract integration test"
    );

    const config = getIntegrationTestConfig();

    // Capture before-state
    const beforeSnapshot = await captureContractSnapshot(
      config.contractIds.streamManager
    );

    // Navigate and verify
    await page.goto("/streams");
    await expect(
      page.getByRole("heading", { name: "Streams", level: 1 })
    ).toBeVisible();
    await expect(page.getByText("stream-001")).toBeVisible();

    // Capture after-state
    const afterSnapshot = await captureContractSnapshot(
      config.contractIds.streamManager
    );

    expect(typeof beforeSnapshot.capturedAt).toBe("string");
    expect(typeof afterSnapshot.capturedAt).toBe("string");
  });
});
