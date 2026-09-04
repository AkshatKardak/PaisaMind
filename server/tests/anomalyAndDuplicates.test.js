import { describe, it, expect } from "vitest";
const { stringSimilarity, calculateStats } = require("../services/anomalyService");
const { normalizeMerchant } = require("../services/recurringIntelligenceService");

describe("Anomaly, Recurring & Duplicate Detection Utilities", () => {
  describe("Statistical Baseline Helper (calculateStats)", () => {
    it("should compute accurate mean and standard deviation", () => {
      const numbers = [10, 20, 30, 40, 50];
      const stats = calculateStats(numbers);
      expect(stats.mean).toBe(30);
      expect(Math.round(stats.stdDev)).toBe(16);
      expect(stats.count).toBe(5);
    });

    it("should gracefully handle empty or single-element inputs", () => {
      expect(calculateStats([]).mean).toBe(0);
      expect(calculateStats([100]).stdDev).toBe(0);
    });
  });

  describe("String Similarity Algorithm", () => {
    it("should return 1.0 for identical strings (case-insensitive)", () => {
      expect(stringSimilarity("AWS Cloud Hosting", "aws cloud hosting")).toBe(1.0);
    });

    it("should return high score for minor typos and suffixes", () => {
      const sim = stringSimilarity("Swiggy Order #1234", "Swiggy Order #1235");
      expect(sim).toBeGreaterThanOrEqual(0.85);
    });

    it("should return low score for completely different merchants", () => {
      const sim = stringSimilarity("Adobe Creative Cloud", "Zomato Restaurant Delivery");
      expect(sim).toBeLessThan(0.3);
    });
  });

  describe("Merchant Normalization", () => {
    it("should normalize diverse merchant strings to canonical keywords", () => {
      expect(normalizeMerchant("AWS*Cloud*Services-1290")).toBe("AWS");
      expect(normalizeMerchant("Adobe Systems Software Ireland")).toBe("ADOBE");
      expect(normalizeMerchant("Swiggy Instamart Order")).toBe("SWIGGY");
      expect(normalizeMerchant("WeWork India Coworking Space")).toBe("WEWORK");
    });
  });
});
