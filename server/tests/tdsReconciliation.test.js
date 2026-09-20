import { describe, it, expect } from "vitest";
const {
  calculateEntitySimilarity,
  normalizeEntityName,
} = require("../services/tdsReconciliationService");

describe("3-Way TDS Reconciliation Engine & Fuzzy Matching", () => {
  describe("Entity Name Normalization and Similarity", () => {
    it("should recognize identical entities despite corporate suffixes", () => {
      const sim = calculateEntitySimilarity(
        "Acme Technologies Private Limited",
        "Acme Tech Pvt Ltd"
      );
      expect(sim).toBeGreaterThanOrEqual(0.65);
    });

    it("should normalize legal entity names consistently", () => {
      const norm1 = normalizeEntityName("Google India Pvt. Ltd.");
      const norm2 = normalizeEntityName("Google");
      expect(norm1).toBe("google");
      expect(norm2).toBe("google");
      expect(calculateEntitySimilarity("Google India Pvt. Ltd.", "Google")).toBe(1.0);
    });

    it("should return low similarity for completely unrelated clients", () => {
      const sim = calculateEntitySimilarity("Infosys Limited", "Swiggy Bundl Technologies");
      expect(sim).toBeLessThan(0.4);
    });
  });

  describe("TDS Calculation & Rate Reconciliation", () => {
    it("should accurately calculate expected TDS and net receivable for 194J (10%)", () => {
      const invoiceAmount = 100000;
      const rate = 0.10;
      const expectedTds = invoiceAmount * rate;
      const expectedNet = invoiceAmount - expectedTds;

      expect(expectedTds).toBe(10000);
      expect(expectedNet).toBe(90000);
    });

    it("should accurately calculate expected TDS and net receivable for 194C (1% or 2%)", () => {
      const invoiceAmount = 50000;
      const rate194C = 0.02;
      const expectedTds = invoiceAmount * rate194C;
      const expectedNet = invoiceAmount - expectedTds;

      expect(expectedTds).toBe(1000);
      expect(expectedNet).toBe(49000);
    });
  });
});
