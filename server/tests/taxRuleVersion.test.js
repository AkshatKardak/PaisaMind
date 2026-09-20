import { describe, it, expect } from "vitest";
const { getActiveRules, getFinancialYearFromDate } = require("../services/taxRuleResolver");
const { evaluate44ADAEligibility } = require("../services/taxEligibilityService");
const {
  computeNewRegimeTax,
  computeOldRegimeTax,
  compute44ADATax,
  compareAllRegimes,
} = require("../services/taxIntelligenceService");

describe("Versioned Tax Rule Engine & 44ADA Legal Eligibility", () => {
  describe("TaxRuleResolver", () => {
    it("should resolve FY 2024-25 rules correctly", async () => {
      const rules = await getActiveRules("2024-25");
      expect(rules.version).toBe("FY2024-25-V1");
      expect(rules.financialYear).toBe("2024-25");
      expect(rules.newRegime.standardDeduction).toBe(75000);
      expect(rules.newRegime.rebate87ALimit).toBe(700000);
    });

    it("should resolve FY 2025-26 rules correctly", async () => {
      const rules = await getActiveRules("2025-26");
      expect(rules.version).toBe("FY2025-26-V1");
      expect(rules.financialYear).toBe("2025-26");
      expect(rules.presumptive.section44ADA.enhancedGrossLimit).toBe(7500000);
    });

    it("should derive financial year from date correctly", () => {
      expect(getFinancialYearFromDate(new Date(2025, 4, 15))).toBe("2025-26"); // May 2025
      expect(getFinancialYearFromDate(new Date(2026, 1, 15))).toBe("2025-26"); // Feb 2026
      expect(getFinancialYearFromDate(new Date(2026, 3, 1))).toBe("2026-27");  // April 2026
    });
  });

  describe("Section 44ADA Eligibility Evaluator", () => {
    it("should approve resident individual IT consultant with digital receipts <= 75L", async () => {
      const res = await evaluate44ADAEligibility({
        grossReceipts: 6500000,
        cashReceipts: 100000, // < 5% cash
        taxpayerType: "INDIVIDUAL",
        profession: "INFORMATION_TECHNOLOGY",
      });
      expect(res.isEligible).toBe(true);
      expect(res.applicableGrossLimit).toBe(7500000);
      expect(res.deemedProfit).toBe(3250000); // 50%
    });

    it("should apply standard 50L limit when cash receipts exceed 5%", async () => {
      const res = await evaluate44ADAEligibility({
        grossReceipts: 5500000,
        cashReceipts: 500000, // ~9% cash > 5%
        taxpayerType: "INDIVIDUAL",
        profession: "TECHNICAL_CONSULTANCY",
      });
      expect(res.isEligible).toBe(false);
      expect(res.applicableGrossLimit).toBe(5000000);
      expect(res.reasons[0]).toContain("exceed the applicable statutory limit of ₹50,00,000");
    });

    it("should strictly reject LLPs and Companies under Section 44ADA(1)", async () => {
      const resLLP = await evaluate44ADAEligibility({
        grossReceipts: 4000000,
        cashReceipts: 0,
        taxpayerType: "LLP",
        profession: "ENGINEERING",
      });
      expect(resLLP.isEligible).toBe(false);
      expect(resLLP.reasons[0]).toContain("Limited Liability Partnerships (LLPs) and Companies cannot opt for presumptive taxation");

      const resCo = await evaluate44ADAEligibility({
        grossReceipts: 4000000,
        cashReceipts: 0,
        taxpayerType: "COMPANY",
        profession: "LEGAL",
      });
      expect(resCo.isEligible).toBe(false);
    });
  });

  describe("Tax Intelligence with Versioned Rules", () => {
    it("should calculate 0 tax for income <= 7L under New Regime", async () => {
      const res = await computeNewRegimeTax(680000, false, "2025-26");
      expect(res.totalTax).toBe(0);
      expect(res.ruleVersion).toBe("FY2025-26-V1");
    });

    it("should calculate correct tax for 12L income under Section 44ADA", async () => {
      const res = await compute44ADATax(1200000, true, {}, { financialYear: "2025-26" });
      expect(res.isEligible).toBe(true);
      expect(res.deemedProfit).toBe(600000);
      expect(res.totalTax).toBe(0); // 6L <= 7L rebate limit
    });
  });
});
