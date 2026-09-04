import { describe, it, expect } from "vitest";
const {
  parseFlexibleDate,
  parseCleanAmount,
  detectColumnMapping,
  parseCsvStatement,
} = require("../services/statementParserService");
const { categorizeTransaction } = require("../services/categorizationService");

describe("Bank Statement Ingestion & Categorization Engine", () => {
  describe("Date Parsing (parseFlexibleDate)", () => {
    it("should parse standard Indian DD/MM/YYYY formats", () => {
      const d = parseFlexibleDate("15/08/2026");
      expect(d.getDate()).toBe(15);
      expect(d.getMonth()).toBe(7); // 0-indexed August
      expect(d.getFullYear()).toBe(2026);
    });

    it("should parse DD-MM-YYYY formats", () => {
      const d = parseFlexibleDate("26-01-2026");
      expect(d.getDate()).toBe(26);
      expect(d.getMonth()).toBe(0); // January
      expect(d.getFullYear()).toBe(2026);
    });

    it("should parse ISO YYYY-MM-DD formats", () => {
      const d = parseFlexibleDate("2026-11-05");
      expect(d.getFullYear()).toBe(2026);
    });
  });

  describe("Amount Cleaning (parseCleanAmount)", () => {
    it("should strip currency symbols, commas, and CR/DR indicators", () => {
      expect(parseCleanAmount("₹ 1,45,000.50")).toBe(145000.5);
      expect(parseCleanAmount("5,000.00 CR")).toBe(5000);
      expect(parseCleanAmount("-1,200")).toBe(1200);
      expect(parseCleanAmount("")).toBe(0);
    });
  });

  describe("Column Auto-Detection (detectColumnMapping)", () => {
    it("should match standard Indian bank headers", () => {
      const headers = ["Txn Date", "Narration", "Chq/Ref No", "Withdrawal (Dr)", "Deposit (Cr)", "Closing Balance"];
      const mapping = detectColumnMapping(headers);
      expect(mapping.date).toBe("Txn Date");
      expect(mapping.description).toBe("Narration");
      expect(mapping.debit).toBe("Withdrawal (Dr)");
      expect(mapping.credit).toBe("Deposit (Cr)");
      expect(mapping.balance).toBe("Closing Balance");
    });
  });

  describe("CSV Parsing (parseCsvStatement)", () => {
    it("should parse standard CSV text buffer into structured rows", () => {
      const csvContent = `Date,Description,Debit,Credit,Balance\n12/08/2026,AWS EMEA Software,4999.00,,95000.00\n15/08/2026,Client Retainer Payment,,75000.00,170000.00`;
      const result = parseCsvStatement(Buffer.from(csvContent));
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].Description).toBe("AWS EMEA Software");
      expect(result.rows[0].Debit).toBe("4999.00");
      expect(result.rows[1].Credit).toBe("75000.00");
    });
  });

  describe("Automatic Transaction Categorization", () => {
    it("should categorize SaaS tools correctly", async () => {
      const res = await categorizeTransaction(null, "AWS Web Services Billing", "expense");
      expect(res.category).toBe("Software Subscriptions");
      expect(res.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it("should categorize Food delivery correctly", async () => {
      const res = await categorizeTransaction(null, "Swiggy Order Bangalore", "expense");
      expect(res.category).toBe("Food");
    });

    it("should categorize Inward client payments as Freelance Income", async () => {
      const res = await categorizeTransaction(null, "UPI-NEFT-ACME CORP-RETAINER", "income");
      expect(res.category).toBe("Freelance Income");
    });
  });
});
