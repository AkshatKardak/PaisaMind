import { describe, it, expect, vi } from "vitest";

vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: vi.fn(() => ({ promise: Promise.resolve({ numPages: 0 }) })),
  version: "mocked",
}));

import { parseStatementText } from "../../client/src/utils/clientStatementParser";
const {
  reconcilePayment,
  verifyInvoicePayment,
  verifySweepToken
} = require("../services/paymentReconciliationService");
const Invoice = require("../models/Invoice");

describe("Phase 4 Acceptance Tests — Statements & Payment Verification", () => {
  it("detects running-balance mismatch on tampered statement lines and raises warning", () => {
    // A clean statement
    const cleanText = `
HDFC Bank Statement
01/11/2026 Opening Balance 0.00 0.00 10000.00
02/11/2026 Client Payout 0.00 50000.00 60000.00
03/11/2026 Office Rent 20000.00 0.00 40000.00
`;
    const cleanResult = parseStatementText(cleanText);
    expect(cleanResult.hasBalanceMismatch).toBe(false);
    expect(cleanResult.warnings.length).toBe(0);

    // A tampered statement (balance should be 40000, but forged to 55000)
    const tamperedText = `
HDFC Bank Statement
01/11/2026 Opening Balance 0.00 0.00 10000.00
02/11/2026 Client Payout 0.00 50000.00 60000.00
03/11/2026 Office Rent 20000.00 0.00 55000.00
`;
    const tamperedResult = parseStatementText(tamperedText);
    expect(tamperedResult.hasBalanceMismatch).toBe(true);
    expect(tamperedResult.warnings.length).toBeGreaterThan(0);
    expect(tamperedResult.warnings[0]).toContain("Running balance mismatch");
  });

  it("verify-payment returns paid for captured payment and sent for uncaptured one", async () => {
    // 1. Captured payment
    const mockInvoice = {
      _id: "60c72b2f9b1d8b2bad000010",
      invoiceNumber: "INV-010",
      status: "sent",
      amount: 25000,
      save: vi.fn().mockResolvedValue(true)
    };

    vi.spyOn(Invoice, "findById").mockResolvedValue(mockInvoice);

    const capturedPayment = {
      id: "pay_captured_123",
      amount: 2500000,
      status: "captured",
      captured: true,
      notes: { invoiceId: "60c72b2f9b1d8b2bad000010" }
    };

    const reconResult = await reconcilePayment(capturedPayment);
    expect(reconResult.status).toBe("paid");
    expect(reconResult.newlyPaid).toBe(true);
    expect(mockInvoice.status).toBe("Paid");

    // 2. Uncaptured / authorized payment
    const mockUncapturedInvoice = {
      _id: "60c72b2f9b1d8b2bad000011",
      invoiceNumber: "INV-011",
      status: "sent",
      amount: 15000,
      save: vi.fn().mockResolvedValue(true)
    };
    Invoice.findById.mockResolvedValue(mockUncapturedInvoice);

    const uncapturedPayment = {
      id: "pay_uncaptured_123",
      amount: 1500000,
      status: "created",
      captured: false,
      notes: { invoiceId: "60c72b2f9b1d8b2bad000011" }
    };

    const uncapturedResult = await reconcilePayment(uncapturedPayment);
    expect(uncapturedResult.status).not.toBe("paid");

    Invoice.findById.mockRestore();
  });

  it("rejects sweep request with wrong SWEEP_TOKEN in constant time", () => {
    process.env.SWEEP_TOKEN = "a1b2c3d4e5f678901234567890abcdef";

    // Correct token
    expect(verifySweepToken("a1b2c3d4e5f678901234567890abcdef")).toBe(true);

    // Wrong token
    expect(verifySweepToken("wrong_token_value")).toBe(false);

    // Empty or missing token
    expect(verifySweepToken("")).toBe(false);
    expect(verifySweepToken(null)).toBe(false);
  });

  it("rejects sweep request when SWEEP_TOKEN is not in environment", () => {
    const originalToken = process.env.SWEEP_TOKEN;
    delete process.env.SWEEP_TOKEN;

    expect(verifySweepToken("any_token_value")).toBe(false);
    expect(verifySweepToken("")).toBe(false);

    process.env.SWEEP_TOKEN = originalToken;
  });

  it("re-running the sweep on an already-paid invoice is idempotent", async () => {
    const alreadyPaidInvoice = {
      _id: "60c72b2f9b1d8b2bad000012",
      invoiceNumber: "INV-012",
      status: "Paid",
      amount: 50000,
      save: vi.fn()
    };

    vi.spyOn(Invoice, "findById").mockResolvedValue(alreadyPaidInvoice);

    const paymentEntity = {
      id: "pay_captured_repeat",
      status: "captured",
      captured: true,
      notes: { invoiceId: "60c72b2f9b1d8b2bad000012" }
    };

    // First call
    const run1 = await reconcilePayment(paymentEntity);
    expect(run1.status).toBe("paid");
    expect(run1.idempotent).toBe(true);

    // Second call
    const run2 = await reconcilePayment(paymentEntity);
    expect(run2.status).toBe("paid");
    expect(run2.idempotent).toBe(true);
    expect(alreadyPaidInvoice.save).not.toHaveBeenCalled();

    Invoice.findById.mockRestore();
  });
});
