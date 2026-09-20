import { describe, it, expect } from "vitest";
const { maskPII } = require("../utils/secureFileUtils");
const { parsePageLines } = require("../services/documentProcessingService");

describe("Secure Document & Page-by-Page Ingestion Pipeline", () => {
  describe("PII Masking Filter", () => {
    it("should mask Indian PAN numbers", () => {
      const text = "Payment received from client with PAN ABCDE1234F on ledger.";
      const masked = maskPII(text);
      expect(masked).toBe("Payment received from client with PAN ABCDE****F on ledger.");
    });

    it("should mask Indian Aadhaar numbers", () => {
      const text = "Verification record: 1234 5678 9012 submitted.";
      const masked = maskPII(text);
      expect(masked).toBe("Verification record: ****-****-9012 submitted.");
    });

    it("should mask Indian bank account numbers", () => {
      const text = "Credit to account 50100234567890 via NEFT.";
      const masked = maskPII(text);
      expect(masked).toMatch(/5010\*+890/);
    });
  });

  describe("Page-by-Page Line Parser", () => {
    it("should extract transaction lines and preserve sourcePage", () => {
      const pageText = `
        12/08/2026 AWS Cloud Services 4500.00 DR
        15/08/2026 Acme Corp Retainer 75000.00 CR
      `;
      const rows = parsePageLines(pageText, 4);
      expect(rows).toHaveLength(2);
      expect(rows[0].Description).toBe("AWS Cloud Services");
      expect(rows[0].Debit).toBe("4500.00");
      expect(rows[0].sourcePage).toBe(4);
      expect(rows[0].extractionMethod).toBe("pdf_table");

      expect(rows[1].Description).toBe("Acme Corp Retainer");
      expect(rows[1].Credit).toBe("75000.00");
      expect(rows[1].sourcePage).toBe(4);
    });
  });
});
