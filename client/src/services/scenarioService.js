import api from "./api";

/**
 * Deterministic fallback simulation engine matching backend simulateScenario shape
 */
function calculateLocalSimulation(scenarioData) {
  const {
    scenarioType = "large_purchase",
    amount = 70000,
    percentage = 20,
    monthlyRecurring = 0,
    delayDays = 30,
    itemDescription = "Equipment / Expense",
  } = scenarioData;

  const currentCashBalance = 260000;
  const currentMonthlyIncome = 120000;
  const currentMonthlyExpense = 50000;
  const currentRunwayMonths = Number((currentCashBalance / currentMonthlyExpense).toFixed(1));

  let balBase = currentCashBalance;
  let balOpt = currentCashBalance;
  let balStress = currentCashBalance;

  let addedMonthlyExpense = 0;
  if (scenarioType === "new_recurring_expense" || scenarioType === "new_emi") {
    addedMonthlyExpense = Number(monthlyRecurring || amount || 0);
  }

  if (scenarioType === "large_purchase") {
    balBase -= Number(amount || 0);
    balOpt -= Number(amount || 0);
    balStress -= Number(amount || 0);
  }

  const baseTrack = { runwayMonths: 0, endingBalance: 0, totalIncome: 0, totalExpense: 0, monthlyBalances: [] };
  const optTrack = { runwayMonths: 0, endingBalance: 0, totalIncome: 0, totalExpense: 0, monthlyBalances: [] };
  const stressTrack = { runwayMonths: 0, endingBalance: 0, totalIncome: 0, totalExpense: 0, monthlyBalances: [] };

  const incomeMultiplierBase = scenarioType === "income_decrease" ? (1 - percentage / 100) : scenarioType === "income_increase" ? (1 + percentage / 100) : 1;
  const incomeMultiplierOpt = scenarioType === "income_decrease" ? (1 - (percentage * 0.7) / 100) : (1 + (percentage * 1.3) / 100);
  const incomeMultiplierStress = scenarioType === "income_decrease" ? (1 - (percentage * 1.3) / 100) : 0.85;

  for (let m = 1; m <= 6; m++) {
    const incBase = currentMonthlyIncome * incomeMultiplierBase;
    const expBase = currentMonthlyExpense + addedMonthlyExpense;
    balBase += (incBase - expBase);
    baseTrack.monthlyBalances.push({ month: `Month ${m}`, balance: Math.round(balBase), net: Math.round(incBase - expBase) });

    const incOpt = currentMonthlyIncome * incomeMultiplierOpt;
    const expOpt = (currentMonthlyExpense * 0.95) + addedMonthlyExpense;
    balOpt += (incOpt - expOpt);
    optTrack.monthlyBalances.push({ month: `Month ${m}`, balance: Math.round(balOpt), net: Math.round(incOpt - expOpt) });

    const incStress = currentMonthlyIncome * incomeMultiplierStress;
    const expStress = (currentMonthlyExpense * 1.05) + addedMonthlyExpense;
    balStress += (incStress - expStress);
    stressTrack.monthlyBalances.push({ month: `Month ${m}`, balance: Math.round(balStress), net: Math.round(incStress - expStress) });
  }

  const newMonthlyBurn = currentMonthlyExpense + addedMonthlyExpense;
  baseTrack.endingBalance = Math.round(balBase);
  optTrack.endingBalance = Math.round(balOpt);
  stressTrack.endingBalance = Math.round(balStress);

  baseTrack.runwayMonths = Number((Math.max(0, balBase) / Math.max(1000, newMonthlyBurn)).toFixed(1));
  optTrack.runwayMonths = Number((Math.max(0, balOpt) / Math.max(1000, newMonthlyBurn * 0.95)).toFixed(1));
  stressTrack.runwayMonths = Number((Math.max(0, balStress) / Math.max(1000, newMonthlyBurn * 1.05)).toFixed(1));

  let isAffordable = true;
  let recommendation = "";
  let riskAssessment = "LOW";

  if (scenarioType === "large_purchase") {
    const postPurchaseBuffer = currentCashBalance - Number(amount || 0);
    const minSafeBuffer = currentMonthlyExpense * 2.0;

    if (postPurchaseBuffer < 0) {
      isAffordable = false;
      riskAssessment = "CRITICAL";
      recommendation = `Cannot afford immediately. Purchasing ${itemDescription} (₹${Number(amount).toLocaleString("en-IN")}) exceeds liquid cash reserves by ₹${Math.abs(postPurchaseBuffer).toLocaleString("en-IN")}.`;
    } else if (postPurchaseBuffer < minSafeBuffer) {
      isAffordable = true;
      riskAssessment = "MODERATE";
      recommendation = `Technically affordable, but not recommended right now. Your liquid cash buffer drops to ₹${postPurchaseBuffer.toLocaleString("en-IN")}, below your safe 2-month reserve.`;
    } else {
      isAffordable = true;
      riskAssessment = "LOW";
      recommendation = `Comfortably affordable. After the ₹${Number(amount).toLocaleString("en-IN")} purchase, your cash buffer remains at ₹${postPurchaseBuffer.toLocaleString("en-IN")} (${baseTrack.runwayMonths} months runway).`;
    }
  } else if (scenarioType === "income_decrease") {
    recommendation = `A ${percentage}% drop reduces monthly income to ₹${Math.round(currentMonthlyIncome * incomeMultiplierBase).toLocaleString("en-IN")}. Your cash runway contracts to ${baseTrack.runwayMonths}m (Stress case: ${stressTrack.runwayMonths}m).`;
    riskAssessment = baseTrack.runwayMonths < 3 ? "HIGH" : "MEDIUM";
  } else {
    recommendation = `Scenario simulated across Base, Optimistic, and Stress conditions. 6-month projected ending balance: ₹${baseTrack.endingBalance.toLocaleString("en-IN")}.`;
  }

  return {
    scenarioType,
    itemDescription,
    inputParams: scenarioData,
    baseline: {
      currentCashBalance,
      currentMonthlyIncome,
      currentMonthlyExpense,
      currentRunwayMonths,
    },
    results: {
      isAffordable,
      riskAssessment,
      recommendation,
      baseCase: baseTrack,
      optimisticCase: optTrack,
      stressCase: stressTrack,
    },
  };
}

export const scenarioService = {
  simulate: async (scenarioData) => {
    try {
      const res = await api.post("/scenarios/simulate", scenarioData);
      return res.data;
    } catch (err) {
      if (err.response?.status === 404 || err.code === "ERR_NETWORK" || err.code === "ECONNABORTED") {
        console.warn("[ScenarioService] Using deterministic fallback simulation:", err.message);
        return {
          success: true,
          data: calculateLocalSimulation(scenarioData),
          isFallback: true,
        };
      }
      throw err;
    }
  },
};

export default scenarioService;
