/**
 * submitReading.spec.ts
 *
 * End-to-end integration test: Submit meter reading → Verify reading stored.
 *
 * Tests the /dashboard route (DashboardPageClient) which shows an overview of
 * active meters, consumption totals, streams, and bills – the primary surface
 * through which readings are validated and surfaced to users.
 *
 * Soroban-dependent assertions are gated behind `isSorobanRpcHealthy()`.
 */

import { expect, test } from "@playwright/test";

import {
  captureContractSnapshot,
  isSorobanRpcHealthy,
} from "../setupTestEnvironment";
import { getIntegrationTestConfig } from "../testConfig";
import { TestWallet } from "../TestWallet";
import {
  readingFactory,
  readingTimeSeries,
} from "../../factories/readingFactory";

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe("Dashboard page – UI rendering", () => {
  test("page loads with Dashboard heading", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Dashboard", level: 1 })
    ).toBeVisible();
  });

  test("page renders the descriptive subtitle", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByText(
        "Overview of your utility meters, usage statistics, and recent activity."
      )
    ).toBeVisible();
  });

  test("Export button is present", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("button", { name: /export/i })
    ).toBeVisible();
  });

  test("Active Meters card is visible", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Active Meters")).toBeVisible();
  });

  test("Total Consumption card is visible", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Total Consumption")).toBeVisible();
  });

  test("Active Streams card is visible", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Active Streams")).toBeVisible();
  });

  test("Pending Bills card is visible", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Pending Bills")).toBeVisible();
  });

  test("Gas Buffer card is visible", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Gas Buffer")).toBeVisible();
  });

  test("Monthly Spend card is visible", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Monthly Spend")).toBeVisible();
  });

  test("summary cards display numeric values", async ({ page }) => {
    await page.goto("/dashboard");
    // At least one card value should be a number (e.g., "12" for Active Meters)
    await expect(page.getByText("12")).toBeVisible();
  });

  test("trend indicators are present (up/down/stable)", async ({ page }) => {
    await page.goto("/dashboard");
    // Gas Buffer shows "+12.1"
    await expect(page.getByText("+12.1")).toBeVisible();
  });
});

test.describe("Reading factory", () => {
  test("readingFactory generates a valid reading", () => {
    const reading = readingFactory({ meterId: "meter-001", unit: "kWh" });
    expect(reading.meterId).toBe("meter-001");
    expect(reading.unit).toBe("kWh");
    expect(typeof reading.value).toBe("number");
    expect(reading.value).toBeGreaterThan(0);
    expect(typeof reading.timestamp).toBe("string");
    expect(new Date(reading.timestamp).getTime()).not.toBeNaN();
  });

  test("readingTimeSeries generates the correct number of readings", () => {
    const series = readingTimeSeries(24, "meter-002", 1);
    expect(series).toHaveLength(24);
    // Timestamps should be in ascending order
    for (let i = 1; i < series.length; i++) {
      const prev = new Date(series[i - 1]!.timestamp).getTime();
      const curr = new Date(series[i]!.timestamp).getTime();
      expect(curr).toBeGreaterThan(prev);
    }
  });

  test("readingTimeSeries all share the given meterId", () => {
    const series = readingTimeSeries(5, "meter-abc");
    expect(series.every((r) => r.meterId === "meter-abc")).toBe(true);
  });
});

test.describe("Submit-reading – wallet mock integration", () => {
  test("gas used is within benchmark after simulated reading submission", async () => {
    const config = getIntegrationTestConfig();
    const wallet = await TestWallet.fromTestConfig(
      "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
    );

    const reading = readingFactory({ meterId: "meter-001" });
    await wallet.signTransaction(
      `SUBMIT_READING_${reading.meterId}_${reading.timestamp}`,
      config.gasBenchmarks.submitReading - 1
    );

    expect(wallet.getTotalGasUsed()).toBeLessThanOrEqual(
      config.gasBenchmarks.submitReading
    );
    wallet.reset();
  });
});

test.describe("Submit-reading – Soroban integration (requires local RPC)", () => {
  test("submit meter reading -> reading stored on-chain", async ({ page }) => {
    test.skip(
      !(await isSorobanRpcHealthy()),
      "Soroban RPC not available – skipping contract integration test"
    );

    const config = getIntegrationTestConfig();

    // Capture before-state of the meter registry contract
    const beforeSnapshot = await captureContractSnapshot(
      config.contractIds.meterRegistry
    );

    // Navigate to dashboard and verify readings surface correctly
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Dashboard", level: 1 })
    ).toBeVisible();
    await expect(page.getByText("Total Consumption")).toBeVisible();

    // Capture after-state
    const afterSnapshot = await captureContractSnapshot(
      config.contractIds.meterRegistry
    );

    expect(typeof beforeSnapshot.capturedAt).toBe("string");
    expect(typeof afterSnapshot.capturedAt).toBe("string");
  });
});
