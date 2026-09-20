import { describe, it, expect } from "vitest";
const { validateAndNormalizeLedger } = require("../services/ledgerValidationService");

describe("Canonical Ledger & Validation Engine", () => {
  it("should validate clean transactions and assign VALIDATED status", async () => {
    const raw = [
      {
        rawDate: "2026-08-15",
        amount: 5000,
        type: "expense",
        category: "Food",
        confidence: 0.95,
        rawDescription: "Swiggy Order Bangalore",
      },
    ];

    const result = await validateAndNormalizeLedger(raw, []);
    expect(result).toHaveLength(1);
    expect(result[0].validationStatus).toBe("VALIDATED");
    expect(result[0].selected).toBe(true);
    expect(result[0].transactionId).toBeDefined();
  });

  it("should detect balance continuity discrepancies", async () => {
    const raw = [
      {
        rawDate: "2026-08-10",
        amount: 1000,
        type: "expense",
        balance: 9000, // starting bal 10000 - 1000 = 9000
        rawDescription: "Groceries",
      },
      {
        rawDate: "2026-08-11",
        amount: 2000,
        type: "expense",
        balance: 5000, // expected 9000 - 2000 = 7000, but is 5000 (delta = 2000!)
        rawDescription: "Electronics",
      },
    ];

    const result = await validateAndNormalizeLedger(raw, []);
    expect(result).toHaveLength(2);
    expect(result[1].validationStatus).toBe("REVIEW_REQUIRED");
    expect(result[1].validationFlags.some((f) => f.includes("BALANCE_DISCREPANCY"))).toBe(true);
  });

  it("should detect intra-batch and database duplicates", async () => {
    const raw = [
      {
        rawDate: "2026-08-15",
        amount: 4500,
        type: "expense",
        rawDescription: "AWS Cloud Services",
      },
      {
        rawDate: "2026-08-15",
        amount: 4500,
        type: "expense",
        rawDescription: "AWS Cloud Services",
      },
    ];

    const result = await validateAndNormalizeLedger(raw, []);
    expect(result).toHaveLength(2);
    expect(result[0].validationStatus).toBe("VALIDATED");
    expect(result[1].validationStatus).toBe("DUPLICATE");
    expect(result[1].isDuplicate).toBe(true);
    expect(result[1].selected).toBe(false);
  });
});
