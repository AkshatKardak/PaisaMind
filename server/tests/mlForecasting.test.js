import { describe, it, expect } from "vitest";
const {
  runForecasting,
  detectAnomalies,
  holtLinearTrendNode,
  modifiedZScoreNode,
} = require("../services/mlBridgeService");

describe("ML Intelligence Layer & Bridge", () => {
  describe("Forecasting Engine & Backtesting", () => {
    it("should return INSUFFICIENT_DATA when history has fewer than 3 months", async () => {
      const result = await runForecasting([{ month: "2025-01", income: 50000, expense: 25000 }], 3);
      expect(result.status).toBe("INSUFFICIENT_DATA");
      expect(result.minimumRequired).toBe(3);
      expect(result.currentCount).toBe(1);
    });

    it("should compute forecasts and backtest metrics (MAE, RMSE) on 6 months of data", async () => {
      const history = [
        { month: "2025-01", income: 60000, expense: 30000 },
        { month: "2025-02", income: 65000, expense: 32000 },
        { month: "2025-03", income: 70000, expense: 31000 },
        { month: "2025-04", income: 72000, expense: 33000 },
        { month: "2025-05", income: 75000, expense: 35000 },
        { month: "2025-06", income: 80000, expense: 36000 },
      ];

      const result = await runForecasting(history, 3, [15000, 10000, 0]);
      expect(result.status).toBe("SUCCESS");
      expect(result.backtestMetrics.mae).toBeGreaterThanOrEqual(0);
      expect(result.backtestMetrics.rmse).toBeGreaterThanOrEqual(0);
      expect(result.forecast).toHaveLength(3);
      expect(result.forecast[0].predictedIncome).toBeGreaterThan(0);
      expect(result.forecast[0].lowerBoundIncome).toBeLessThanOrEqual(result.forecast[0].predictedIncome);
      expect(result.forecast[0].upperBoundIncome).toBeGreaterThanOrEqual(result.forecast[0].predictedIncome);
    });

    it("should compute Holt's linear trend with upward trajectory", () => {
      const series = [100, 120, 140, 160, 180];
      const preds = holtLinearTrendNode(series, 2);
      expect(preds[0]).toBeGreaterThan(180);
      expect(preds[1]).toBeGreaterThan(preds[0]);
    });
  });

  describe("Modified Z-Score Outlier Detector (MAD)", () => {
    it("should detect extreme spending outliers using robust MAD", () => {
      // Normal values around 500-1000, one extreme outlier at 50,000
      const amounts = [500, 520, 480, 550, 600, 510, 50000];
      const scores = modifiedZScoreNode(amounts);
      expect(scores[scores.length - 1]).toBeGreaterThan(3.5);
    });
  });
});
