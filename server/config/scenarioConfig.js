/**
 * Versioned Configuration for Financial Scenario Simulations & Monte Carlo Engine
 */
const SCENARIO_CONFIG = {
  iterations: 100,
  projectionMonths: 6,
  defaultIncomeChangePercentage: 20,
  minSafeBufferMonths: 2.0,
  minimumMonthlyBurn: 1000,
  defaultCoefficientOfVariation: 20,
  stressDropMultiplier: 0.8,
  optimisticGainMultiplier: 0.5,
  minStressDrop: 0.15,
  maxStressDrop: 0.40,
  minOptimisticGain: 0.10,
  maxOptimisticGain: 0.30,
};

module.exports = {
  SCENARIO_CONFIG,
};
