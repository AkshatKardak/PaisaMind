const { calculateCashRunway } = require("./runwayService");
const { generateCashFlowForecast } = require("./forecastingService");
const { analyzeIncomeVolatility } = require("./incomeVolatilityService");
const { SCENARIO_CONFIG } = require("../config/scenarioConfig");

/**
 * Monte Carlo simulator for 6-month projected cash flow
 */
const runMonteCarloSimulation = ({
  iterations = SCENARIO_CONFIG.iterations,
  months = SCENARIO_CONFIG.projectionMonths,
  initialCash = 0,
  baseMonthlyIncome = 0,
  baseMonthlyExpense = 0,
  incomeStdDev = 0,
  expenseStdDev = 0,
  oneTimeExpense = 0,
  addedMonthlyExpense = 0,
}) => {
  const endingBalances = [];

  // Simple Box-Muller transform for normal distribution sampling
  const sampleNormal = (mean, stdDev) => {
    if (stdDev <= 0) return mean;
    const u1 = Math.max(0.0001, Math.random());
    const u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z * stdDev;
  };

  for (let i = 0; i < iterations; i++) {
    let cash = initialCash - oneTimeExpense;
    for (let m = 1; m <= months; m++) {
      const inc = Math.max(0, sampleNormal(baseMonthlyIncome, incomeStdDev));
      const exp = Math.max(
        SCENARIO_CONFIG.minimumMonthlyBurn,
        sampleNormal(baseMonthlyExpense + addedMonthlyExpense, expenseStdDev)
      );
      cash += (inc - exp);
    }
    endingBalances.push(Math.round(cash));
  }

  endingBalances.sort((a, b) => a - b);
  const p10 = endingBalances[Math.floor(iterations * 0.10)];
  const p25 = endingBalances[Math.floor(iterations * 0.25)];
  const p50 = endingBalances[Math.floor(iterations * 0.50)];
  const p75 = endingBalances[Math.floor(iterations * 0.75)];
  const p90 = endingBalances[Math.floor(iterations * 0.90)];

  const negativeCount = endingBalances.filter((b) => b < 0).length;
  const probNegativeCash = Math.round((negativeCount / iterations) * 100);

  const monthlyBurn = Math.max(
    SCENARIO_CONFIG.minimumMonthlyBurn,
    baseMonthlyExpense + addedMonthlyExpense
  );
  const insufficientRunwayCount = endingBalances.filter((b) => (b / monthlyBurn) < 3.0).length;
  const probInsufficientRunway = Math.round((insufficientRunwayCount / iterations) * 100);

  return {
    p10,
    p25,
    p50,
    p75,
    p90,
    probNegativeCash,
    probInsufficientRunway,
    iterations,
  };
};

/**
 * What-If Financial Scenario Simulation Engine with Volatility & Monte Carlo
 */
const simulateScenario = async (userId, params = {}) => {
  const {
    scenarioType,
    amount = 0,
    percentage = 0,
    monthlyRecurring = 0,
    delayDays = 0,
    itemDescription = "Financial Adjustment",
  } = params;

  // 1. Fetch current baseline runway, forecast, and historical income volatility
  const [currentRunway, forecastData, volatilityData] = await Promise.all([
    calculateCashRunway(userId),
    generateCashFlowForecast(userId),
    analyzeIncomeVolatility(userId, 6).catch(() => ({ coefficientOfVariation: SCENARIO_CONFIG.defaultCoefficientOfVariation })),
  ]);

  const currentMonthlyIncome = params.currentMonthlyIncome !== undefined
    ? Number(params.currentMonthlyIncome)
    : (forecastData.averageMonthlyIncome || 0);

  const currentMonthlyExpense = params.currentMonthlyExpense !== undefined
    ? Number(params.currentMonthlyExpense)
    : (currentRunway.monthlyBurnRate || 0);

  const currentCashBalance = params.currentCashBalance !== undefined
    ? Number(params.currentCashBalance)
    : (currentRunway.liquidCashBalance || 0);

  // If no transaction baseline and no explicit financial parameters provided
  if (currentMonthlyIncome === 0 && currentMonthlyExpense === 0 && currentCashBalance === 0 && !amount && !percentage) {
    return {
      status: "INSUFFICIENT_DATA",
      message: "Insufficient historical transaction baseline. Please record income/expenses or provide baseline figures to simulate scenarios.",
      scenarioType,
      baseline: { currentCashBalance: 0, currentMonthlyIncome: 0, currentMonthlyExpense: 0, currentRunwayMonths: 0 },
      results: null,
    };
  }

  // Volatility-derived multipliers from validated config
  const cvPct = (volatilityData.coefficientOfVariation || SCENARIO_CONFIG.defaultCoefficientOfVariation) / 100;
  const stressDropFactor = Math.min(
    SCENARIO_CONFIG.maxStressDrop,
    Math.max(SCENARIO_CONFIG.minStressDrop, cvPct * SCENARIO_CONFIG.stressDropMultiplier)
  );
  const optimisticGainFactor = Math.min(
    SCENARIO_CONFIG.maxOptimisticGain,
    Math.max(SCENARIO_CONFIG.minOptimisticGain, cvPct * SCENARIO_CONFIG.optimisticGainMultiplier)
  );

  const monthsToSimulate = SCENARIO_CONFIG.projectionMonths;
  const tracks = {
    base: { monthlyBalances: [], totalIncome: 0, totalExpense: 0, endingBalance: 0, runwayMonths: 0 },
    optimistic: { monthlyBalances: [], totalIncome: 0, totalExpense: 0, endingBalance: 0, runwayMonths: 0 },
    stress: { monthlyBalances: [], totalIncome: 0, totalExpense: 0, endingBalance: 0, runwayMonths: 0 },
  };

  let oneTimeExpense = 0;
  let incomeMultiplierBase = 1.0;
  let incomeMultiplierOptimistic = 1.0 + optimisticGainFactor;
  let incomeMultiplierStress = Math.max(0.2, 1.0 - stressDropFactor);
  let addedMonthlyExpense = Number(monthlyRecurring || 0);

  if (scenarioType === "large_purchase") {
    oneTimeExpense = Number(amount || 0);
  } else if (scenarioType === "income_decrease") {
    const dropPct = Number(percentage || SCENARIO_CONFIG.defaultIncomeChangePercentage) / 100;
    incomeMultiplierBase = Math.max(0, 1.0 - dropPct);
    incomeMultiplierOptimistic = Math.max(0, 1.0 - (dropPct * 0.6));
    incomeMultiplierStress = Math.max(0, 1.0 - (dropPct * 1.4));
  } else if (scenarioType === "income_increase") {
    const gainPct = Number(percentage || SCENARIO_CONFIG.defaultIncomeChangePercentage) / 100;
    incomeMultiplierBase = 1.0 + gainPct;
    incomeMultiplierOptimistic = 1.0 + (gainPct * 1.3);
    incomeMultiplierStress = 1.0 + (gainPct * 0.5);
  } else if (scenarioType === "new_recurring_expense" || scenarioType === "new_emi") {
    addedMonthlyExpense = Number(amount || monthlyRecurring || 0);
  }

  let balBase = currentCashBalance - oneTimeExpense;
  let balOpt = currentCashBalance - oneTimeExpense;
  let balStress = currentCashBalance - oneTimeExpense;

  for (let m = 1; m <= monthsToSimulate; m++) {
    let delayedInvoiceShift = 0;
    if (scenarioType === "delayed_invoice" && m === 1) {
      delayedInvoiceShift = -Number(amount || 0);
    } else if (scenarioType === "delayed_invoice" && m === 2) {
      delayedInvoiceShift = Number(amount || 0);
    }

    // BASE CASE
    const incBase = (currentMonthlyIncome * incomeMultiplierBase) + delayedInvoiceShift;
    const expBase = currentMonthlyExpense + addedMonthlyExpense;
    balBase += (incBase - expBase);
    tracks.base.totalIncome += incBase;
    tracks.base.totalExpense += expBase;
    tracks.base.monthlyBalances.push({ month: `Month ${m}`, balance: Math.round(balBase), net: Math.round(incBase - expBase) });

    // OPTIMISTIC CASE
    const incOpt = (currentMonthlyIncome * incomeMultiplierOptimistic) + (delayedInvoiceShift * 1.1);
    const expOpt = (currentMonthlyExpense * 0.95) + addedMonthlyExpense;
    balOpt += (incOpt - expOpt);
    tracks.optimistic.totalIncome += incOpt;
    tracks.optimistic.totalExpense += expOpt;
    tracks.optimistic.monthlyBalances.push({ month: `Month ${m}`, balance: Math.round(balOpt), net: Math.round(incOpt - expOpt) });

    // STRESS CASE
    const incStress = (currentMonthlyIncome * incomeMultiplierStress) + (m >= 3 ? delayedInvoiceShift : 0);
    const expStress = (currentMonthlyExpense * 1.05) + addedMonthlyExpense;
    balStress += (incStress - expStress);
    tracks.stress.totalIncome += incStress;
    tracks.stress.totalExpense += expStress;
    tracks.stress.monthlyBalances.push({ month: `Month ${m}`, balance: Math.round(balStress), net: Math.round(incStress - expStress) });
  }

  tracks.base.endingBalance = Math.round(balBase);
  tracks.optimistic.endingBalance = Math.round(balOpt);
  tracks.stress.endingBalance = Math.round(balStress);

  const newMonthlyBurn = currentMonthlyExpense + addedMonthlyExpense;
  tracks.base.runwayMonths = Number((Math.max(0, balBase) / Math.max(1000, newMonthlyBurn)).toFixed(1));
  tracks.optimistic.runwayMonths = Number((Math.max(0, balOpt) / Math.max(1000, newMonthlyBurn * 0.95)).toFixed(1));
  tracks.stress.runwayMonths = Number((Math.max(0, balStress) / Math.max(1000, newMonthlyBurn * 1.05)).toFixed(1));

  // Monte Carlo Simulation
  const monteCarlo = runMonteCarloSimulation({
    iterations: SCENARIO_CONFIG.iterations,
    months: SCENARIO_CONFIG.projectionMonths,
    initialCash: currentCashBalance,
    baseMonthlyIncome: currentMonthlyIncome * incomeMultiplierBase,
    baseMonthlyExpense: currentMonthlyExpense,
    incomeStdDev: currentMonthlyIncome * Math.max(0.1, cvPct),
    expenseStdDev: currentMonthlyExpense * 0.15,
    oneTimeExpense,
    addedMonthlyExpense,
  });

  // Affordability Decision Logic
  let isAffordable = true;
  let recommendation = "";
  let riskAssessment = "LOW";

  if (scenarioType === "large_purchase") {
    const postPurchaseBuffer = currentCashBalance - Number(amount || 0);
    const minSafeBuffer = currentMonthlyExpense * 2.0;

    if (postPurchaseBuffer < 0) {
      isAffordable = false;
      riskAssessment = "CRITICAL";
      recommendation = `Cannot afford immediately. Buying ${itemDescription} (₹${Number(amount).toLocaleString("en-IN")}) exceeds current liquid cash (₹${currentCashBalance.toLocaleString("en-IN")}) by ₹${Math.abs(postPurchaseBuffer).toLocaleString("en-IN")}.`;
    } else if (postPurchaseBuffer < minSafeBuffer) {
      isAffordable = true;
      riskAssessment = "MODERATE";
      recommendation = `Technically affordable, but caution advised. Your liquid cash buffer drops from ₹${currentCashBalance.toLocaleString("en-IN")} to ₹${postPurchaseBuffer.toLocaleString("en-IN")}, below your safe 2-month reserve (₹${Math.round(minSafeBuffer).toLocaleString("en-IN")}).`;
    } else {
      isAffordable = true;
      riskAssessment = "LOW";
      recommendation = `Comfortably affordable. After the ₹${Number(amount).toLocaleString("en-IN")} purchase, your cash buffer remains at ₹${postPurchaseBuffer.toLocaleString("en-IN")} (${tracks.base.runwayMonths} months runway).`;
    }
  } else if (scenarioType === "income_decrease") {
    recommendation = `A ${percentage || 20}% drop reduces monthly income to ₹${Math.round(currentMonthlyIncome * incomeMultiplierBase).toLocaleString("en-IN")}. Your cash runway contracts from ${currentRunway.expectedRunwayMonths}m to ${tracks.base.runwayMonths}m (Stress case: ${tracks.stress.runwayMonths}m).`;
    riskAssessment = tracks.base.runwayMonths < 3 ? "HIGH" : "MEDIUM";
  } else {
    recommendation = `Scenario simulated across Base, Optimistic, and Stress conditions. 6-month projected ending balance: ₹${tracks.base.endingBalance.toLocaleString("en-IN")}.`;
  }

  return {
    scenarioType,
    itemDescription,
    inputParams: params,
    baseline: {
      currentCashBalance,
      currentMonthlyIncome: Math.round(currentMonthlyIncome),
      currentMonthlyExpense: Math.round(currentMonthlyExpense),
      currentRunwayMonths: currentRunway.expectedRunwayMonths,
    },
    volatilityFactors: {
      coefficientOfVariation: Math.round(cvPct * 100),
      stressDropFactor: Math.round(stressDropFactor * 100),
      optimisticGainFactor: Math.round(optimisticGainFactor * 100),
    },
    monteCarloProbabilities: {
      p10: monteCarlo.p10,
      p25: monteCarlo.p25,
      p50: monteCarlo.p50,
      p75: monteCarlo.p75,
      p90: monteCarlo.p90,
      probNegativeCash: monteCarlo.probNegativeCash,
      probInsufficientRunway: monteCarlo.probInsufficientRunway,
      p10StressBalance: monteCarlo.p10,
      p50MedianBalance: monteCarlo.p50,
      p90OptimisticBalance: monteCarlo.p90,
      iterations: monteCarlo.iterations,
    },
    results: {
      isAffordable,
      riskAssessment,
      recommendation,
      baseCase: tracks.base,
      optimisticCase: tracks.optimistic,
      stressCase: tracks.stress,
    },
  };
};

module.exports = {
  simulateScenario,
  runMonteCarloSimulation,
};
