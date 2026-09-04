import { describe, it, expect, vi } from "vitest";
const mongoose = require("mongoose");
const { simulateScenario } = require("../services/simulationService");

describe("Scenario Simulator & Decision Engine", () => {
  const validUserId = new mongoose.Types.ObjectId();

  it("should calculate affordability and runway for large purchases", async () => {
    const result = await simulateScenario(validUserId, {
      scenarioType: "large_purchase",
      amount: 70000,
      itemDescription: "MacBook Air",
    });

    expect(result.scenarioType).toBe("large_purchase");
    expect(result.results.baseCase).toBeDefined();
    expect(result.results.optimisticCase).toBeDefined();
    expect(result.results.stressCase).toBeDefined();
    expect(result.results.recommendation).toBeDefined();
    expect(result.results.baseCase.monthlyBalances).toHaveLength(6);
  });

  it("should evaluate income decrease scenarios with correct stress multipliers", async () => {
    const result = await simulateScenario(validUserId, {
      scenarioType: "income_decrease",
      percentage: 20,
      itemDescription: "20% Client Loss",
    });

    expect(result.results.stressCase.runwayMonths).toBeLessThanOrEqual(result.results.baseCase.runwayMonths);
    expect(result.results.baseCase.runwayMonths).toBeLessThanOrEqual(result.results.optimisticCase.runwayMonths);
  });
});
