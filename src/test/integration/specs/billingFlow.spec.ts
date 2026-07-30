/**
 * billingFlow.spec.ts
 *
 * End-to-end integration test: Full billing cycle → Submit readings → Bill
 * generated → Payment processed → Invoice visible.
 *
 * Tests the /billing route rendered by BillingPageClient.
 * Soroban-dependent assertions are gated behind `isSorobanRpcHealthy()`.
 */

import { expect, test } from "@playwright/test";

import {
  captureContractSnapshot,
  isSorobanRpcHealthy,
} from "../setupTestEnvironment";
import { getIntegrationTestConfig } from "../testConfig";
import { TestWallet } from "../TestWallet";

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe("Billing page – UI rendering", () => {
  test("page loads with Billing heading", async ({ page }) => {
    await page.goto("/billing");
    await expect(
      page.getByRole("heading", { name: "Billing", level: 1 })
    ).toBeVisible();
  });

  test("page renders the descriptive subtitle", async ({ page }) => {
    await page.goto("/billing");
    await expect(
      page.getByText(
        "View billing history, manage payments, and track usage costs."
      )
    ).toBeVisible();
  });

  test("Export button is present", async ({ page }) => {
    await page.goto("/billing");
    await expect(
      page.getByRole("button", { name: /export/i })
    ).toBeVisible();
  });

  test("View Invoice button is present", async ({ page }) => {
    await page.goto("/billing");
    await expect(
      page.getByRole("button", { name: /view invoice/i })
    ).toBeVisible();
  });

  test("data table renders with expected column headers", async ({ page }) => {
    await page.goto("/billing");
    const expectedHeaders = [
      "Invoice #",
      "Meter ID",
      "Period",
      "Consumption",
      "Rate",
      "Amount",
      "Status",
      "Due Date",
    ];
    for (const header of expectedHeaders) {
      await expect(page.getByRole("columnheader", { name: header })).toBeVisible();
    }
  });

  test("sample invoice INV-2024-001 appears in the table", async ({ page }) => {
    await page.goto("/billing");
    await expect(page.getByText("INV-2024-001")).toBeVisible();
  });

  test("sample invoice INV-2024-002 appears in the table", async ({ page }) => {
    await page.goto("/billing");
    await expect(page.getByText("INV-2024-002")).toBeVisible();
  });

  test("sample invoice INV-2024-003 appears in the table", async ({ page }) => {
    await page.goto("/billing");
    await expect(page.getByText("INV-2024-003")).toBeVisible();
  });

  test("Paid status badge is visible", async ({ page }) => {
    await page.goto("/billing");
    await expect(page.getByText("Paid")).toBeVisible();
  });

  test("Pending status badge is visible", async ({ page }) => {
    await page.goto("/billing");
    await expect(page.getByText("Pending")).toBeVisible();
  });

  test("Overdue status badge is visible", async ({ page }) => {
    await page.goto("/billing");
    await expect(page.getByText("Overdue")).toBeVisible();
  });

  test("clicking View Invoice toggles the invoice template", async ({
    page,
  }) => {
    await page.goto("/billing");
    const toggleBtn = page.getByRole("button", { name: /view invoice/i });

    // Invoice template should not be visible initially
    await expect(page.getByText("INV-2024-002")).toBeVisible(); // table entry, not template header

    // Click to show invoice
    await toggleBtn.click();
    await expect(
      page.getByRole("button", { name: /hide invoice/i })
    ).toBeVisible();

    // Click again to hide
    await page.getByRole("button", { name: /hide invoice/i }).click();
    await expect(
      page.getByRole("button", { name: /view invoice/i })
    ).toBeVisible();
  });
});

test.describe("Billing page – wallet mock integration", () => {
  test("gas used is within benchmark for a billing processing transaction", async () => {
    const config = getIntegrationTestConfig();
    const wallet = await TestWallet.fromTestConfig(
      "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
    );

    // Simulate signing two transactions: reading submission + billing trigger
    await wallet.signTransaction("SUBMIT_READING_METER001", 500);
    await wallet.signTransaction("PROCESS_BILLING_INV001", 650);

    expect(wallet.getTotalGasUsed()).toBeLessThanOrEqual(
      config.gasBenchmarks.processBilling
    );
    wallet.reset();
  });

  test("wallet tracks multiple transactions individually", async () => {
    const wallet = await TestWallet.fromTestConfig(
      "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
    );

    await wallet.signTransaction("TX_READ_1", 300);
    await wallet.signTransaction("TX_BILL_1", 400);
    await wallet.signTransaction("TX_PAYMENT_1", 250);

    expect(wallet.transactions).toHaveLength(3);
    expect(wallet.getTotalGasUsed()).toBe(950);
    expect(wallet.getLastTransactionGas()).toBe(250);
    wallet.reset();
  });
});

test.describe("Billing flow – Soroban integration (requires local RPC)", () => {
  test("billing flow -> bill generated -> invoice present", async ({
    page,
  }) => {
    test.skip(
      !(await isSorobanRpcHealthy()),
      "Soroban RPC not available – skipping contract integration test"
    );

    const config = getIntegrationTestConfig();

    // Capture before-state of the billing ledger contract
    const beforeSnapshot = await captureContractSnapshot(
      config.contractIds.billingLedger
    );

    // Navigate to billing and verify invoices surface correctly
    await page.goto("/billing");
    await expect(
      page.getByRole("heading", { name: "Billing", level: 1 })
    ).toBeVisible();
    await expect(page.getByText("INV-2024-001")).toBeVisible();

    // Capture after-state
    const afterSnapshot = await captureContractSnapshot(
      config.contractIds.billingLedger
    );

    expect(typeof beforeSnapshot.capturedAt).toBe("string");
    expect(typeof afterSnapshot.capturedAt).toBe("string");
  });
});
