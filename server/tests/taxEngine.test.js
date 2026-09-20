import { describe, it, expect } from "vitest";
const {
  computeNewRegimeTax,
  computeOldRegimeTax,
  compute44ADATax,
  compareAllRegimes,
  calculateRecommendedTaxReserve,
  calculateGSTStatus,
  computeAdvanceTaxSchedule,
} = require("../services/taxIntelligenceService");

describe("Tax Intelligence Engine (FY 2025-26)", () => {
  describe("New Tax Regime (Section 115BAC)", () => {
    it("should calculate 0 tax for income <= ₹7,00,000 due to Section 87A rebate", async () => {
      const result = await computeNewRegimeTax(650000, false);
      expect(result.taxBeforeCess).toBe(0);
      expect(result.totalTax).toBe(0);
      expect(result.effectiveRate).toBe(0);
    });

    it("should apply correct slabs and 4% cess for taxable income above ₹7,00,000", async () => {
      const result = await computeNewRegimeTax(1000000, false);
      expect(result.taxBeforeCess).toBe(50000);
      expect(result.cess).toBe(2000);
      expect(result.totalTax).toBe(52000);
    });

    it("should correctly handle standard deduction for salaried users", async () => {
      const result = await computeNewRegimeTax(1000000, true);
      expect(result.standardDeduction).toBe(75000);
      expect(result.taxableIncome).toBe(925000);
    });
  });

  describe("Section 44ADA Presumptive Taxation", () => {
    it("should deem exactly 50% of gross receipts as taxable profits for eligible professionals", async () => {
      const grossReceipts = 1200000;
      const result = await compute44ADATax(grossReceipts, true);
      expect(result.isEligible).toBe(true);
      expect(result.deemedProfit).toBe(600000); // 50%
      expect(result.totalTax).toBe(0);
    });

    it("should flag ineligibility when gross receipts exceed statutory limit", async () => {
      const result = await compute44ADATax(8000000, true);
      expect(result.isEligible).toBe(false);
    });
  });

  describe("Old Tax Regime Deductions", () => {
    it("should cap 80C at ₹1,50,000 and apply standard 80D limits", async () => {
      const result = await computeOldRegimeTax(1200000, {
        section80C: 250000, // over 1.5L
        section80D: 25000,
        hra: 60000,
      });
      expect(result.deductions.section80C).toBe(150000);
      expect(result.deductions.section80D).toBe(25000);
      expect(result.deductions.hra).toBe(60000);
    });
  });

  describe("GST Threshold Tracking", () => {
    it("should identify safe, warning, and mandatory registration thresholds accurately", async () => {
      const safe = await calculateGSTStatus(1200000);
      expect(safe.status).toBe("safe");
      expect(safe.progressPercent).toBe(60);

      const warning = await calculateGSTStatus(1850000);
      expect(warning.status).toBe("warning");

      const mandatory = await calculateGSTStatus(2100000);
      expect(mandatory.status).toBe("mandatory_registration");
    });
  });

  describe("Advance Tax Schedule", () => {
    it("should produce 4 statutory quarters and mark liability when tax > ₹10,000", async () => {
      const schedule = await computeAdvanceTaxSchedule(100000);
      expect(schedule.isLiable).toBe(true);
      expect(schedule.installments).toHaveLength(4);
      expect(schedule.installments[0].cumulativePercentage).toBe(15);
      expect(schedule.installments[3].cumulativePercentage).toBe(100);
    });
  });
});
