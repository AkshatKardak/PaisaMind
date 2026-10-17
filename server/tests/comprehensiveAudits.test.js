import { describe, it, expect } from "vitest";
const mongoose = require("mongoose");
const { getActiveRules, getFinancialYearFromDate } = require("../services/taxRuleResolver");
const {
  computeNewRegimeTax,
  calculatePresumptive44ADA,
  calculateGSTStatus,
  computeAdvanceTaxSchedule,
  calculateRecommendedTaxReserve,
} = require("../services/taxIntelligenceService");
const {
  calculateEntitySimilarity,
  normalizeEntityName,
} = require("../services/tdsReconciliationService");
const {
  parsePageLines,
  ocrWithTesseract,
} = require("../services/documentProcessingService");
const { generateCashFlowForecast } = require("../services/forecastingService");
const { simulateScenario, runMonteCarloSimulation } = require("../services/simulationService");
const { SCENARIO_CONFIG } = require("../config/scenarioConfig");
const { validateMagicBytes, maskPII } = require("../utils/secureFileUtils");

describe("Comprehensive Audits & Edge Cases Across 8 Focus Areas", () => {
  describe("1. Versioned Tax Rules & AY 2026-27 (FY 2025-26)", () => {
    it("should resolve active FY 2025-26 rules with standard deduction and 44ADA limits", async () => {
      const rules = await getActiveRules("2025-26");
      expect(rules.status).toBe("ACTIVE");
      expect(rules.financialYear).toBe("2025-26");
      expect(rules.assessmentYear).toBe("2026-27");
      expect(rules.newRegime.standardDeduction).toBe(75000);
      expect(rules.presumptive.section44ADA.enhancedGrossLimit).toBe(7500000);
      expect(rules.reconciliation).toBeDefined();
      expect(rules.reconciliation.amountTolerance).toBe(5);
    });

    it("should reject DRAFT tax rules in production calculations", async () => {
      // 2026-27 is marked DRAFT in tax_rules
      await expect(getActiveRules("2026-27", false)).rejects.toThrow(/Cannot use DRAFT tax rules/i);
    });

    it("should record rule version and authoritative source on every calculation", async () => {
      const taxResult = await computeNewRegimeTax(1200000, true);
      expect(taxResult.ruleVersion).toBeDefined();
      expect(taxResult.source).toBeDefined();

      const adaResult = await calculatePresumptive44ADA(5000000, true, {}, { cashReceipts: 100000 });
      expect(adaResult.ruleVersion).toBeDefined();
      expect(adaResult.source).toBeDefined();

      const gstResult = await calculateGSTStatus(2500000);
      expect(gstResult.source).toBeDefined();

      const advTax = await computeAdvanceTaxSchedule(50000);
      expect(advTax.source).toBeDefined();

      const reserve = await calculateRecommendedTaxReserve({ ytdIncome: 1000000 });
      expect(reserve.source).toBeDefined();
    });

    it("should correctly handle Section 44ADA when cash receipts exceed 5%", async () => {
      const adaResult = await calculatePresumptive44ADA(6000000, true, {}, {
        cashReceipts: 500000, // > 5% cash
      });
      // Limit drops from 75L to 50L, so 60L exceeds 50L limit
      expect(adaResult.isEligible).toBe(false);
      expect(adaResult.applicableGrossLimit).toBe(5000000);
      expect(adaResult.eligibilityReasons.join(" ")).toContain("exceed");
    });
  });

  describe("2. TDS Reconciliation & CanonicalTransaction Fields", () => {
    it("should normalize entity names and match without ML branding", () => {
      const sim = calculateEntitySimilarity("Google India Pvt Ltd", "Google India");
      expect(sim).toBeGreaterThanOrEqual(0.7);
      expect(normalizeEntityName("Tata Consultancy Services Limited")).toBe("tata");
    });
  });

  describe("3. Large Multi-Page Documents & Multi-Line Transactions", () => {
    it("should parse multi-line bank statement transactions without losing data", () => {
      const multiLineText = `
        01/05/2025 UPI/512345678901/Swiggy
        Order #1234 Bangalore Food
        450.00 DR 25,450.00
        02/05/2025 NEFT/Client Retainer Payment
        Client Acme Corp
        75,000.00 CR 1,00,450.00
      `;

      const rows = parsePageLines(multiLineText, 1);
      expect(rows.length).toBe(2);
      expect(rows[0].Date).toBe("01/05/2025");
      expect(rows[0].Description).toContain("Swiggy");
      expect(rows[0].Debit).toBe("450.00");
      expect(rows[0].sourcePage).toBe(1);

      expect(rows[1].Date).toBe("02/05/2025");
      expect(rows[1].Description).toContain("Client Retainer Payment");
      expect(rows[1].Credit).toBe("75,000.00");
    });

    it("should preserve sourcePage, extractionMethod, and confidence for every extracted row", () => {
      const singleText = `10/05/2025 AWS Cloud Hosting 12500.00 DR`;
      const rows = parsePageLines(singleText, 3);
      expect(rows[0].sourcePage).toBe(3);
      expect(rows[0].extractionMethod).toBe("pdf_table");
      expect(rows[0].extractionConfidence).toBeGreaterThan(0.7);
    });
  });

  describe("4. ML Forecasting - Zero Fake Fallbacks", () => {
    it("should return INSUFFICIENT_DATA and zero fake values when offline or insufficient data", async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const result = await generateCashFlowForecast(fakeUserId);

      expect(result.status).toBe("INSUFFICIENT_DATA");
      expect(result.hasSufficientData).toBe(false);
      expect(result.forecast).toEqual([]);
      expect(result.averageMonthlyIncome).toBe(0);
      expect(result.averageMonthlyExpense).toBe(0);
      expect(result.confidenceLevel).toBe("None");
    });
  });

  describe("5. Monte Carlo & Scenario Simulation - Zero Arbitrary Defaults", () => {
    it("should use validated SCENARIO_CONFIG for simulations", () => {
      expect(SCENARIO_CONFIG.iterations).toBe(100);
      expect(SCENARIO_CONFIG.projectionMonths).toBe(6);
      expect(SCENARIO_CONFIG.minSafeBufferMonths).toBe(2.0);
    });

    it("should return INSUFFICIENT_DATA when baseline figures are zero and no params given", async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const result = await simulateScenario(fakeUserId, {});
      expect(result.status).toBe("INSUFFICIENT_DATA");
      expect(result.baseline.currentCashBalance).toBe(0);
      expect(result.baseline.currentMonthlyIncome).toBe(0);
    });

    it("should simulate large purchase with user parameters without fabricating numbers", async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const result = await simulateScenario(fakeUserId, {
        scenarioType: "large_purchase",
        amount: 50000,
        currentCashBalance: 120000,
        currentMonthlyIncome: 80000,
        currentMonthlyExpense: 35000,
      });

      expect(result.baseline.currentCashBalance).toBe(120000);
      expect(result.baseline.currentMonthlyIncome).toBe(80000);
      expect(result.results.isAffordable).toBe(true);
      expect(result.results.baseCase.monthlyBalances).toHaveLength(6);
      expect(result.monteCarloProbabilities.p50).toBeDefined();
    });

    it("should run Monte Carlo simulation with 0 defaults cleanly", () => {
      const mc = runMonteCarloSimulation({
        iterations: 50,
        months: 3,
        initialCash: 10000,
        baseMonthlyIncome: 5000,
        baseMonthlyExpense: 3000,
      });

      expect(mc.p50).toBeGreaterThan(0);
      expect(mc.iterations).toBe(50);
      expect(mc.probNegativeCash).toBeGreaterThanOrEqual(0);
      expect(mc.probNegativeCash).toBeLessThanOrEqual(100);
    });
  });

  describe("6. Security, IDOR Protection & Sanitization", () => {
    it("should reject files with spoofed extensions via magic bytes", () => {
      // Create a fake text buffer claimed to be a PDF
      const fakePdfBuffer = Buffer.from("This is not a real PDF file header");
      const validation = validateMagicBytes(fakePdfBuffer, "pdf");
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain("spoofing attempt");
    });

    it("should accept valid PDF magic bytes", () => {
      const validPdfHeader = Buffer.from("%PDF-1.4 sample content");
      const validation = validateMagicBytes(validPdfHeader, "pdf");
      expect(validation.isValid).toBe(true);
    });

    it("should mask sensitive PII in raw text", () => {
      const sensitive = "Client PAN: ABCDE1234F, Aadhaar: 1234 5678 9012, Account: 50100123456789";
      const masked = maskPII(sensitive);
      expect(masked).not.toContain("ABCDE1234F");
      expect(masked).not.toContain("1234 5678 9012");
      expect(masked).toContain("ABCDE****F");
      expect(masked).toContain("****-****-9012");
    });
  });
});
