const { calculateCashRunway } = require("./runwayService");
const { generateCashFlowForecast } = require("./forecastingService");
const { calculateRecommendedTaxReserve } = require("./taxIntelligenceService");

/**
 * What-If Financial Scenario Simulation Engine
 */
const simulateScenario = async (userId, params) => {
  const {
    scenarioType, // "large_purchase" | "income_decrease" | "income_increase" | "new_recurring_expense" | "delayed_invoice" | "new_emi"
    amount = 0,
    percentage = 0,
    monthlyRecurring = 0,
    delayDays = 0,
    itemDescription = "Financial Adjustment",
  } = params;

  // 1. Fetch current baseline runway and cash flow forecast
  const [currentRunway, forecastData] = await Promise.all([
    calculateCashRunway(userId),
    generateCashFlowForecast(userId),
  ]);

  const currentMonthlyIncome = forecastData.averageMonthlyIncome || 75000;
  const currentMonthlyExpense = currentRunway.monthlyBurnRate || 45000;
  const currentCashBalance = currentRunway.liquidCashBalance || 100000;

  // Base parameters for 6-month simulation
  const monthsToSimulate = 6;
  const tracks = {
    base: { monthlyBalances: [], totalIncome: 0, totalExpense: 0, endingBalance: 0, runwayMonths: 0 },
    optimistic: { monthlyBalances: [], totalIncome: 0, totalExpense: 0, endingBalance: 0, runwayMonths: 0 },
    stress: { monthlyBalances: [], totalIncome: 0, totalExpense: 0, endingBalance: 0, runwayMonths: 0 },
  };

  // Compute impacts based on scenario type
  let oneTimeExpense = 0;
  let incomeMultiplierBase = 1.0;
  let incomeMultiplierOptimistic = 1.1;
  let incomeMultiplierStress = 0.8;
  let addedMonthlyExpense = Number(monthlyRecurring || 0);

  if (scenarioType === "large_purchase") {
    oneTimeExpense = Number(amount || 0);
  } else if (scenarioType === "income_decrease") {
    const dropPct = Number(percentage || 20) / 100;
    incomeMultiplierBase = Math.max(0, 1.0 - dropPct);
    incomeMultiplierOptimistic = Math.max(0, 1.0 - (dropPct * 0.5));
    incomeMultiplierStress = Math.max(0, 1.0 - (dropPct * 1.5));
  } else if (scenarioType === "income_increase") {
    const gainPct = Number(percentage || 20) / 100;
    incomeMultiplierBase = 1.0 + gainPct;
    incomeMultiplierOptimistic = 1.0 + (gainPct * 1.3);
    incomeMultiplierStress = 1.0 + (gainPct * 0.5);
  } else if (scenarioType === "new_recurring_expense") {
    addedMonthlyExpense = Number(amount || monthlyRecurring || 0);
  } else if (scenarioType === "new_emi") {
    addedMonthlyExpense = Number(amount || monthlyRecurring || 0);
  } else if (scenarioType === "delayed_invoice") {
    // Delay income in month 1, collect in month 2/3
  }

  // Simulate month by month
  let balBase = currentCashBalance - oneTimeExpense;
  let balOpt = currentCashBalance - oneTimeExpense;
  let balStress = currentCashBalance - oneTimeExpense;

  for (let m = 1; m <= monthsToSimulate; m++) {
    // Delayed invoice adjustment in month 1
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

    // OPTIMISTIC CASE (+5% income, -5% discretionary expenses)
    const incOpt = (currentMonthlyIncome * incomeMultiplierOptimistic) + (delayedInvoiceShift * 1.1);
    const expOpt = (currentMonthlyExpense * 0.95) + addedMonthlyExpense;
    balOpt += (incOpt - expOpt);
    tracks.optimistic.totalIncome += incOpt;
    tracks.optimistic.totalExpense += expOpt;
    tracks.optimistic.monthlyBalances.push({ month: `Month ${m}`, balance: Math.round(balOpt), net: Math.round(incOpt - expOpt) });

    // STRESS CASE (-10% additional stress income, full burn)
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

  // Projected Post-Scenario Runways
  const newMonthlyBurn = currentMonthlyExpense + addedMonthlyExpense;
  tracks.base.runwayMonths = Number((Math.max(0, balBase) / Math.max(1000, newMonthlyBurn)).toFixed(1));
  tracks.optimistic.runwayMonths = Number((Math.max(0, balOpt) / Math.max(1000, newMonthlyBurn * 0.95)).toFixed(1));
  tracks.stress.runwayMonths = Number((Math.max(0, balStress) / Math.max(1000, newMonthlyBurn * 1.05)).toFixed(1));

  // Affordability Decision Logic for purchases
  let isAffordable = true;
  let recommendation = "";
  let riskAssessment = "LOW";

  if (scenarioType === "large_purchase") {
    const postPurchaseBuffer = currentCashBalance - Number(amount || 0);
    const minSafeBuffer = currentMonthlyExpense * 2.0; // 2 months burn

    if (postPurchaseBuffer < 0) {
      isAffordable = false;
      riskAssessment = "CRITICAL";
      recommendation = `Cannot afford immediately. Buying ${itemDescription} (₹${Number(amount).toLocaleString("en-IN")}) exceeds current liquid cash (₹${currentCashBalance.toLocaleString("en-IN")}) by ₹${Math.abs(postPurchaseBuffer).toLocaleString("en-IN")}.`;
    } else if (postPurchaseBuffer < minSafeBuffer) {
      isAffordable = true;
      riskAssessment = "MODERATE";
      recommendation = `Technically affordable, but not recommended right now. Your liquid cash buffer drops from ₹${currentCashBalance.toLocaleString("en-IN")} to ₹${postPurchaseBuffer.toLocaleString("en-IN")}, below your safe 2-month reserve (₹${Math.round(minSafeBuffer).toLocaleString("en-IN")}). Recommend waiting until pending invoices are collected.`;
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
};
