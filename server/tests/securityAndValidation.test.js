import { describe, it, expect } from "vitest";
const { validateMagicBytes, maskPII } = require("../utils/secureFileUtils");
const { evaluate44ADAEligibility } = require("../services/taxEligibilityService");
const { runMonteCarloSimulation } = require("../services/simulationService");

describe("Security, File Validation & Mathematical Engine Tests", () => {
  describe("Magic Byte Validation & File Spoofing Prevention", () => {
    it("should accept authentic PDF buffer starting with %PDF-", () => {
      const pdfBuffer = Buffer.from("%PDF-1.7 standard pdf contents");
      const res = validateMagicBytes(pdfBuffer, "pdf");
      expect(res.isValid).toBe(true);
      expect(res.detectedType).toBe("pdf");
    });

    it("should reject executable disguised as PDF (spoofing attempt)", () => {
      const exeBuffer = Buffer.from("MZ\x90\x00\x03\x00\x00\x00"); // Windows PE header
      const res = validateMagicBytes(exeBuffer, "pdf");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("signature does not match");
    });

    it("should accept valid XLSX buffer with PK signature", () => {
      const xlsxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
      const res = validateMagicBytes(xlsxBuffer, "xlsx");
      expect(res.isValid).toBe(true);
      expect(res.detectedType).toBe("xlsx");
    });

    it("should reject binary executable disguised as CSV", () => {
      const binaryBuffer = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x00, 0x01]); // ELF header with null byte
      const res = validateMagicBytes(binaryBuffer, "csv");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("null byte or binary data");
    });

    it("should accept valid UTF-8 CSV text", () => {
      const csvBuffer = Buffer.from("Date,Description,Amount\n2025-05-15,Payment Received,50000\n");
      const res = validateMagicBytes(csvBuffer, "csv");
      expect(res.isValid).toBe(true);
      expect(res.detectedType).toBe("csv");
    });
  });

  describe("PII Masking", () => {
    it("should mask Credit/Debit cards, PAN, Aadhaar, and Bank Accounts", () => {
      const input = "User PAN: ABCDE1234F, Aadhaar: 1234 5678 9012, Card: 4111-2222-3333-4444, A/C: 123456789012";
      const masked = maskPII(input);

      expect(masked).not.toContain("ABCDE1234F");
      expect(masked).toContain("ABCDE****F");

      expect(masked).not.toContain("1234 5678 9012");
      expect(masked).toContain("****-****-9012");

      expect(masked).not.toContain("4111-2222-3333-4444");
      expect(masked).toContain("****-****-****-4444");

      expect(masked).not.toContain("123456789012");
    });
  });

  describe("Section 44ADA Statutory Eligibility Engine", () => {
    it("should return INSUFFICIENT_INFORMATION when taxpayerType or profession is missing", async () => {
      const res = await evaluate44ADAEligibility({
        grossReceipts: 5000000,
        // missing taxpayerType and profession
      });
      expect(res.status).toBe("INSUFFICIENT_INFORMATION");
      expect(res.isEligible).toBe(false);
      expect(res.missingFields.length).toBeGreaterThanOrEqual(2);
      expect(res.reasons[0]).toContain("Cannot determine Section 44ADA statutory eligibility");
    });

    it("should return ELIGIBLE when all statutory requirements are satisfied", async () => {
      const res = await evaluate44ADAEligibility({
        grossReceipts: 6000000,
        cashReceipts: 50000,
        taxpayerType: "INDIVIDUAL",
        profession: "INFORMATION_TECHNOLOGY",
      });
      expect(res.status).toBe("ELIGIBLE");
      expect(res.isEligible).toBe(true);
      expect(res.deemedProfit).toBe(3000000);
    });
  });

  describe("Monte Carlo Simulation Percentiles", () => {
    it("should calculate P10, P25, P50, P75, P90 and risk probabilities", () => {
      const result = runMonteCarloSimulation({
        iterations: 100,
        months: 6,
        initialCash: 100000,
        baseMonthlyIncome: 80000,
        baseMonthlyExpense: 50000,
        incomeStdDev: 10000,
        expenseStdDev: 5000,
      });

      expect(result.p10).toBeDefined();
      expect(result.p25).toBeDefined();
      expect(result.p50).toBeDefined();
      expect(result.p75).toBeDefined();
      expect(result.p90).toBeDefined();
      expect(result.p10).toBeLessThanOrEqual(result.p50);
      expect(result.p50).toBeLessThanOrEqual(result.p90);
      expect(result.probNegativeCash).toBeGreaterThanOrEqual(0);
      expect(result.probNegativeCash).toBeLessThanOrEqual(100);
      expect(result.probInsufficientRunway).toBeGreaterThanOrEqual(0);
      expect(result.probInsufficientRunway).toBeLessThanOrEqual(100);
    });
  });
});
