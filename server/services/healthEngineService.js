const Income = require("../models/Income");
const Expense = require("../models/Expense");
const Invoice = require("../models/Invoice");
const { analyzeIncomeVolatility } = require("./incomeVolatilityService");
const { analyzeInvoiceRisk } = require("./invoiceRiskService");
const { calculateCashRunway } = require("./runwayService");
const { calculateNetWorthAndDebt } = require("./netWorthService");
const { calculateRecommendedTaxReserve } = require("./taxIntelligenceService");

/**
 * Deterministic, Transparent 8-Component Financial Health Engine (Max Score: 100)
 */
const calculateDetailedHealthScore = async (userId) => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  const [
    volatilityData,
    invoiceRiskData,
    runwayData,
    netWorthData,
    currentIncomes,
    currentExpenses,
    threeMonthIncomes,
    threeMonthExpenses,
  ] = await Promise.all([
    analyzeIncomeVolatility(userId, 6),
    analyzeInvoiceRisk(userId),
    calculateCashRunway(userId),
    calculateNetWorthAndDebt(userId),
    Income.find({ userId, date: { $gte: currentMonthStart } }),
    Expense.find({ userId, date: { $gte: currentMonthStart } }),
    Income.find({ userId, date: { $gte: threeMonthsAgo } }),
    Expense.find({ userId, date: { $gte: threeMonthsAgo } }),
  ]);

  const totalCurrentIncome = currentIncomes.reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalCurrentExpense = currentExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const currentSavings = Math.max(0, totalCurrentIncome - totalCurrentExpense);
  const currentSavingsRate = totalCurrentIncome > 0 ? (currentSavings / totalCurrentIncome) : 0;

  const total3MIncome = threeMonthIncomes.reduce((s, i) => s + Number(i.amount || 0), 0);
  const total3MExpense = threeMonthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const avg3MSavingsRate = total3MIncome > 0 ? Math.max(0, (total3MIncome - total3MExpense) / total3MIncome) : 0;

  // ─── 1. Cash Flow Stability (15 pts) ─────────────────────────────────────────
  // Based on income coefficient of variation (CV) and stability score
  const rawStability = volatilityData.stabilityScore || 70;
  const scoreCashFlow = Math.round((rawStability / 100) * 15);

  // ─── 2. Savings Rate (15 pts) ───────────────────────────────────────────────
  // Benchmark: >= 30% savings rate = 15 pts, 20% = 12 pts, 10% = 7 pts, 0% = 2 pts
  const effectiveSavingsRate = avg3MSavingsRate > 0 ? avg3MSavingsRate : currentSavingsRate;
  const scoreSavings = Math.round(Math.min(15, Math.max(2, (effectiveSavingsRate / 0.30) * 15)));

  // ─── 3. Expense Control (15 pts) ────────────────────────────────────────────
  // Benchmark: Expense-to-income ratio <= 60% gets full 15 pts, >90% gets low score
  const expenseRatio = total3MIncome > 0 ? (total3MExpense / total3MIncome) : (totalCurrentIncome > 0 ? totalCurrentExpense / totalCurrentIncome : 0.8);
  let scoreExpenses = 15;
  if (expenseRatio > 1.0) scoreExpenses = 3;
  else if (expenseRatio > 0.8) scoreExpenses = 7;
  else if (expenseRatio > 0.6) scoreExpenses = 11;
  else scoreExpenses = 15;

  // ─── 4. Emergency Runway (15 pts) ───────────────────────────────────────────
  // Benchmark: >= 6 months = 15 pts, 3-6m = 10 pts, 1-3m = 5 pts, <1m = 2 pts
  const runwayMonths = runwayData.expectedRunwayMonths || 3.0;
  let scoreRunway = 2;
  if (runwayMonths >= 6.0) scoreRunway = 15;
  else if (runwayMonths >= 3.0) scoreRunway = Math.round(5 + ((runwayMonths - 3) / 3) * 10);
  else if (runwayMonths >= 1.0) scoreRunway = Math.round(2 + (runwayMonths / 3) * 3);
  else scoreRunway = 2;

  // ─── 5. Invoice Reliability (10 pts) ────────────────────────────────────────
  // Benchmark: Low overdue ratio & high client reliability
  let scoreInvoice = 10;
  if (invoiceRiskData.clients && invoiceRiskData.clients.length > 0) {
    const avgReliability = invoiceRiskData.clients.reduce((s, c) => s + c.reliabilityScore, 0) / invoiceRiskData.clients.length;
    scoreInvoice = Math.round((avgReliability / 100) * 10);
    if (invoiceRiskData.totalOverdueAmount > 50000) scoreInvoice = Math.max(2, scoreInvoice - 3);
  }

  // ─── 6. Debt Burden (10 pts) ────────────────────────────────────────────────
  // Benchmark: DTI <= 20% = 10 pts, 20-35% = 7 pts, >40% = 3 pts
  const dti = netWorthData.dtiPercentage || 0;
  let scoreDebt = 10;
  if (dti === 0) scoreDebt = 10;
  else if (dti <= 20) scoreDebt = 9;
  else if (dti <= 35) scoreDebt = 6;
  else if (dti <= 50) scoreDebt = 3;
  else scoreDebt = 1;

  // ─── 7. Client Concentration (10 pts) ───────────────────────────────────────
  // Benchmark: Top client <= 25% = 10 pts, 25-45% = 7 pts, >50% = 3 pts
  const topClientPct = volatilityData.topClientDependency || 0;
  let scoreConcentration = 10;
  if (topClientPct <= 25) scoreConcentration = 10;
  else if (topClientPct <= 40) scoreConcentration = 8;
  else if (topClientPct <= 60) scoreConcentration = 5;
  else scoreConcentration = 2;

  // ─── 8. Tax Reserve Coverage (10 pts) ───────────────────────────────────────
  // Benchmark: Recommended tax reserve calculated and understood
  const taxReserve = calculateRecommendedTaxReserve({
    ytdIncome: total3MIncome * 4,
    newIncomeAmount: 0,
    regime: "new",
    use44ADA: true,
  });
  const scoreTaxReserve = taxReserve.totalAnnualTaxProjected > 0 ? 8 : 10;

  // Total Score (0-100)
  const totalScore = Math.max(0, Math.min(100, Math.round(
    scoreCashFlow +
    scoreSavings +
    scoreExpenses +
    scoreRunway +
    scoreInvoice +
    scoreDebt +
    scoreConcentration +
    scoreTaxReserve
  )));

  const grade = totalScore >= 80 ? "EXCELLENT" : totalScore >= 65 ? "GOOD" : totalScore >= 50 ? "FAIR" : "AT_RISK";

  // Actionable improvements
  const improvements = [];
  if (scoreRunway < 10) improvements.push(`Build your emergency cash buffer to reach at least 6 months of runway (currently ${runwayMonths}m).`);
  if (scoreConcentration < 7) improvements.push(`Reduce client dependency: ${topClientPct}% of your revenue comes from "${volatilityData.topClientName}".`);
  if (scoreInvoice < 7) improvements.push(`Follow up on ₹${invoiceRiskData.totalOverdueAmount.toLocaleString("en-IN")} in overdue client receivables.`);
  if (scoreSavings < 10) improvements.push(`Aim to save at least 25% of monthly income (currently ~${Math.round(effectiveSavingsRate * 100)}%).`);
  if (scoreDebt < 7) improvements.push(`Your debt-to-income ratio is ${dti}%. Target lowering EMI obligations below 25% of monthly income.`);

  const overallResult = {
    totalScore,
    grade,
    breakdown: {
      cashFlowStability: { score: scoreCashFlow, max: 15, label: "Cash Flow Stability", details: `${volatilityData.stabilityLabel}` },
      savingsRate: { score: scoreSavings, max: 15, label: "Savings Rate", details: `${Math.round(effectiveSavingsRate * 100)}% 3-month savings rate` },
      expenseControl: { score: scoreExpenses, max: 15, label: "Expense Control", details: `${Math.round(expenseRatio * 100)}% of income spent` },
      emergencyRunway: { score: scoreRunway, max: 15, label: "Emergency Runway", details: `${runwayMonths} months available` },
      invoiceReliability: { score: scoreInvoice, max: 10, label: "Invoice Reliability", details: `${invoiceRiskData.clients?.length || 0} active clients` },
      debtBurden: { score: scoreDebt, max: 10, label: "Debt Burden", details: `${dti}% Debt-to-Income` },
      clientConcentration: { score: scoreConcentration, max: 10, label: "Client Concentration", details: `${topClientPct}% max client share` },
      taxReserveCoverage: { score: scoreTaxReserve, max: 10, label: "Tax Reserve Coverage", details: "Sec 44ADA / New Regime Reserve" },
    },
    improvements,
    summary: `Financial Health Score: ${totalScore}/100 (${grade}). ${improvements[0] || "Your financial foundation is robust and well-diversified."}`,
  };

  // ─── 9. Monthly Historical Health Trajectory (Last 6 Months) ───────────────
  const monthlyHistory = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let m = 5; m >= 0; m--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const mStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const mEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);
    const label = `${monthNames[targetDate.getMonth()]} ${targetDate.getFullYear()}`;

    const [mIncomes, mExpenses] = await Promise.all([
      Income.find({ userId, date: { $gte: mStart, $lte: mEnd } }),
      Expense.find({ userId, date: { $gte: mStart, $lte: mEnd } }),
    ]);

    const mInc = mIncomes.reduce((s, i) => s + Number(i.amount || 0), 0);
    const mExp = mExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const mSavings = Math.max(0, mInc - mExp);
    const mSavingsRate = mInc > 0 ? (mSavings / mInc) : 0;
    const mExpRatio = mInc > 0 ? (mExp / mInc) : 1;

    // Monthly-specific component scores
    const mSavingsScore = Math.round(Math.min(25, Math.max(5, (mSavingsRate / 0.3) * 25)));
    const mExpScore = mExpRatio <= 0.6 ? 25 : mExpRatio <= 0.8 ? 18 : mExpRatio <= 1.0 ? 10 : 5;
    const mStabilityScore = Math.round(scoreCashFlow * (20 / 15));
    const mRunwayScore = Math.round(scoreRunway * (15 / 15));
    const mInvoiceScore = Math.round(scoreInvoice * (15 / 10));

    const mTotal = Math.min(100, Math.max(15, Math.round(mSavingsScore + mExpScore + mStabilityScore + mRunwayScore + mInvoiceScore)));
    const mGrade = mTotal >= 80 ? "EXCELLENT" : mTotal >= 65 ? "GOOD" : mTotal >= 50 ? "FAIR" : "AT_RISK";

    monthlyHistory.push({
      month: label,
      monthKey: `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`,
      score: mTotal,
      grade: mGrade,
      income: mInc,
      expenses: mExp,
      savings: mSavings,
      savingsRatePct: Math.round(mSavingsRate * 100),
      breakdown: {
        savingsRate: { score: mSavingsScore, max: 25, label: "Savings Rate", details: `${Math.round(mSavingsRate * 100)}% saved` },
        expenseControl: { score: mExpScore, max: 25, label: "Expense Control", details: `${Math.round(mExpRatio * 100)}% of income spent` },
        cashFlowStability: { score: mStabilityScore, max: 20, label: "Cash Flow Stability", details: volatilityData.stabilityLabel },
        runwayBuffer: { score: mRunwayScore, max: 15, label: "Emergency Buffer", details: `${runwayMonths} months runway` },
        invoiceDiscipline: { score: mInvoiceScore, max: 15, label: "Invoice Reliability", details: `${invoiceRiskData.clients?.length || 0} active clients` },
      },
    });
  }

  return {
    ...overallResult,
    monthlyHistory,
  };
};

module.exports = {
  calculateDetailedHealthScore,
};
