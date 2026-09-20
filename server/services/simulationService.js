const { calculateCashRunway } = require("./runwayService");
const { generateCashFlowForecast } = require("./forecastingService");
const { analyzeIncomeVolatility } = require("./incomeVolatilityService");

/**
 * Monte Carlo simulator for 6-month projected cash flow
 */
const runMonteCarloSimulation = ({
  iterations = 100,
  months = 6,
  initialCash = 100000,
  baseMonthlyIncome = 75000,
  baseMonthlyExpense = 45000,
  incomeStdDev = 15000,
  expenseStdDev = 8000,
  oneTimeExpense = 0,
  addedMonthlyExpense = 0,
}) => {
  const endingBalances = [];

  // Simple Box-Muller transform for normal distribution sampling
  const sampleNormal = (mean, stdDev) => {
    const u1 = Math.max(0.0001, Math.random());
    const u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z * stdDev;
  };

  for (let i = 0; i < iterations; i++) {
    let cash = initialCash - oneTimeExpense;
    for (let m = 1; m <= months; m++) {
      const inc = Math.max(0, sampleNormal(baseMonthlyIncome, incomeStdDev));
      const exp = Math.max(1000, sampleNormal(baseMonthlyExpense + addedMonthlyExpense, expenseStdDev));
      cash += (inc - exp);
    }
    endingBalances.push(Math.round(cash));
  }

  endingBalances.sort((a, b) => a - b);
  const p10 = endingBalances[Math.floor(iterations * 0.10)];
  const p50 = endingBalances[Math.floor(iterations * 0.50)];
  const p90 = endingBalances[Math.floor(iterations * 0.90)];

  return { p10, p50, p90, iterations };
};

/**
 * What-If Financial Scenario Simulation Engine with Volatility & Monte Carlo
 */
const simulateScenario = async (userId, params) => {
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
    analyzeIncomeVolatility(userId, 6).catch(() => ({ coefficientOfVariation: 20 })),
  ]);

  const currentMonthlyIncome = forecastData.averageMonthlyIncome || 75000;
  const currentMonthlyExpense = currentRunway.monthlyBurnRate || 45000;
  const currentCashBalance = currentRunway.liquidCashBalance || 100000;

  // Volatility-derived multipliers
  const cvPct = (volatilityData.coefficientOfVariation || 20) / 100;
  const stressDropFactor = Math.min(0.40, Math.max(0.15, cvPct * 0.8));
  const optimisticGainFactor = Math.min(0.30, Math.max(0.10, cvPct * 0.5));

  const monthsToSimulate = 6;
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
    const dropPct = Number(percentage || 20) / 100;
    incomeMultiplierBase = Math.max(0, 1.0 - dropPct);
    incomeMultiplierOptimistic = Math.max(0, 1.0 - (dropPct * 0.6));
    incomeMultiplierStress = Math.max(0, 1.0 - (dropPct * 1.4));
  } else if (scenarioType === "income_increase") {
    const gainPct = Number(percentage || 20) / 100;
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
    iterations: 100,
    months: 6,
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
