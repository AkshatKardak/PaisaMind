const Income = require("../models/Income");
const Expense = require("../models/Expense");
const Invoice = require("../models/Invoice");
const HealthConfig = require("../models/HealthConfig");
const { analyzeIncomeVolatility } = require("./incomeVolatilityService");
const { analyzeInvoiceRisk } = require("./invoiceRiskService");
const { calculateCashRunway } = require("./runwayService");
const { calculateNetWorthAndDebt } = require("./netWorthService");
const { calculateRecommendedTaxReserve } = require("./taxIntelligenceService");

const DEFAULT_WEIGHTS = {
  cashFlowStability: 15,
  savingsRate: 15,
  expenseControl: 15,
  emergencyRunway: 15,
  invoiceReliability: 10,
  debtBurden: 10,
  clientConcentration: 10,
  taxReserveCoverage: 10,
};

/**
 * Deterministic, Transparent 8-Component Financial Health Engine (Max Score: 100)
 */
const calculateDetailedHealthScore = async (userId) => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  // Fetch dynamic weights from HealthConfig
  let weights = DEFAULT_WEIGHTS;
  try {
    const config = await HealthConfig.findOne({ active: true }).lean();
    if (config?.weights) {
      weights = { ...DEFAULT_WEIGHTS, ...config.weights };
    }
  } catch (e) {}

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

  // 1. Cash Flow Stability
  const rawStability = volatilityData.stabilityScore || 70;
  const scoreCashFlow = Math.round((rawStability / 100) * weights.cashFlowStability);

  // 2. Savings Rate
  const effectiveSavingsRate = avg3MSavingsRate > 0 ? avg3MSavingsRate : currentSavingsRate;
  const scoreSavings = Math.round(Math.min(weights.savingsRate, Math.max(2, (effectiveSavingsRate / 0.30) * weights.savingsRate)));

  // 3. Expense Control
  const expenseRatio = total3MIncome > 0 ? (total3MExpense / total3MIncome) : (totalCurrentIncome > 0 ? totalCurrentExpense / totalCurrentIncome : 0.8);
  let scoreExpenses = weights.expenseControl;
  if (expenseRatio > 1.0) scoreExpenses = Math.round(weights.expenseControl * 0.2);
  else if (expenseRatio > 0.8) scoreExpenses = Math.round(weights.expenseControl * 0.47);
  else if (expenseRatio > 0.6) scoreExpenses = Math.round(weights.expenseControl * 0.73);
  else scoreExpenses = weights.expenseControl;

  // 4. Emergency Runway
  const runwayMonths = runwayData.expectedRunwayMonths || 3.0;
  let scoreRunway = Math.round(weights.emergencyRunway * 0.15);
  if (runwayMonths >= 6.0) scoreRunway = weights.emergencyRunway;
  else if (runwayMonths >= 3.0) scoreRunway = Math.round((weights.emergencyRunway * 0.33) + ((runwayMonths - 3) / 3) * (weights.emergencyRunway * 0.67));
  else if (runwayMonths >= 1.0) scoreRunway = Math.round((weights.emergencyRunway * 0.15) + (runwayMonths / 3) * (weights.emergencyRunway * 0.2));

  // 5. Invoice Reliability
  let scoreInvoice = weights.invoiceReliability;
  if (invoiceRiskData.clients && invoiceRiskData.clients.length > 0) {
    const avgReliability = invoiceRiskData.clients.reduce((s, c) => s + c.reliabilityScore, 0) / invoiceRiskData.clients.length;
    scoreInvoice = Math.round((avgReliability / 100) * weights.invoiceReliability);
    if (invoiceRiskData.totalOverdueAmount > 50000) scoreInvoice = Math.max(2, scoreInvoice - 3);
  }

  // 6. Debt Burden
  const dti = netWorthData.dtiPercentage || 0;
  let scoreDebt = weights.debtBurden;
  if (dti === 0) scoreDebt = weights.debtBurden;
  else if (dti <= 20) scoreDebt = Math.round(weights.debtBurden * 0.9);
  else if (dti <= 35) scoreDebt = Math.round(weights.debtBurden * 0.6);
  else if (dti <= 50) scoreDebt = Math.round(weights.debtBurden * 0.3);
  else scoreDebt = Math.round(weights.debtBurden * 0.1);

  // 7. Client Concentration
  const topClientPct = volatilityData.topClientDependency || 0;
  let scoreConcentration = weights.clientConcentration;
  if (topClientPct <= 25) scoreConcentration = weights.clientConcentration;
  else if (topClientPct <= 40) scoreConcentration = Math.round(weights.clientConcentration * 0.8);
  else if (topClientPct <= 60) scoreConcentration = Math.round(weights.clientConcentration * 0.5);
  else scoreConcentration = Math.round(weights.clientConcentration * 0.2);

  // 8. Tax Reserve Coverage
  const taxReserve = await calculateRecommendedTaxReserve({
    ytdIncome: total3MIncome * 4,
    newIncomeAmount: 0,
    regime: "new",
    use44ADA: true,
  });
  const scoreTaxReserve = taxReserve.totalAnnualTaxProjected > 0 ? Math.round(weights.taxReserveCoverage * 0.8) : weights.taxReserveCoverage;

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

  const improvements = [];
  if (scoreRunway < weights.emergencyRunway * 0.67) improvements.push(`Build your emergency cash buffer to reach at least 6 months of runway (currently ${runwayMonths}m).`);
  if (scoreConcentration < weights.clientConcentration * 0.7) improvements.push(`Reduce client dependency: ${topClientPct}% of your revenue comes from "${volatilityData.topClientName}".`);
  if (scoreInvoice < weights.invoiceReliability * 0.7) improvements.push(`Follow up on ₹${invoiceRiskData.totalOverdueAmount.toLocaleString("en-IN")} in overdue client receivables.`);
  if (scoreSavings < weights.savingsRate * 0.67) improvements.push(`Aim to save at least 25% of monthly income (currently ~${Math.round(effectiveSavingsRate * 100)}%).`);
  if (scoreDebt < weights.debtBurden * 0.7) improvements.push(`Your debt-to-income ratio is ${dti}%. Target lowering EMI obligations below 25% of monthly income.`);

  const overallResult = {
    totalScore,
    grade,
    weightsUsed: weights,
    breakdown: {
      cashFlowStability: {
        rawMetric: rawStability,
        normalizedMetric: Math.round((rawStability / 100) * 100) / 100,
        weight: weights.cashFlowStability,
        score: scoreCashFlow,
        max: weights.cashFlowStability,
        label: "Cash Flow Stability",
        details: `${volatilityData.stabilityLabel}`,
        reason: `Income volatility stability score is ${rawStability}/100 (${volatilityData.stabilityLabel}).`,
        confidence: volatilityData.hasSufficientData ? 0.95 : 0.70,
      },
      savingsRate: {
        rawMetric: Math.round(effectiveSavingsRate * 100) / 100,
        normalizedMetric: Math.min(1.0, Math.round((effectiveSavingsRate / 0.30) * 100) / 100),
        weight: weights.savingsRate,
        score: scoreSavings,
        max: weights.savingsRate,
        label: "Savings Rate",
        details: `${Math.round(effectiveSavingsRate * 100)}% 3-month savings rate`,
        reason: `Maintains a ${Math.round(effectiveSavingsRate * 100)}% net savings rate (statutory benchmark: 30%).`,
        confidence: 0.90,
      },
      expenseControl: {
        rawMetric: Math.round(expenseRatio * 100) / 100,
        normalizedMetric: Math.max(0, Math.round((1.0 - Math.min(1.0, expenseRatio)) * 100) / 100),
        weight: weights.expenseControl,
        score: scoreExpenses,
        max: weights.expenseControl,
        label: "Expense Control",
        details: `${Math.round(expenseRatio * 100)}% of income spent`,
        reason: `Operating expenses consume ${Math.round(expenseRatio * 100)}% of total cash receipts.`,
        confidence: 0.92,
      },
      emergencyRunway: {
        rawMetric: runwayMonths,
        normalizedMetric: Math.min(1.0, Math.round((runwayMonths / 6.0) * 100) / 100),
        weight: weights.emergencyRunway,
        score: scoreRunway,
        max: weights.emergencyRunway,
        label: "Emergency Runway",
        details: `${runwayMonths} months available`,
        reason: `Liquid reserves cover ${runwayMonths} months of fixed burn rate (target: 6 months).`,
        confidence: 0.95,
      },
      invoiceReliability: {
        rawMetric: invoiceRiskData.clients?.length || 0,
        normalizedMetric: Math.round((scoreInvoice / weights.invoiceReliability) * 100) / 100,
        weight: weights.invoiceReliability,
        score: scoreInvoice,
        max: weights.invoiceReliability,
        label: "Invoice Reliability",
        details: `${invoiceRiskData.clients?.length || 0} active clients`,
        reason: `${invoiceRiskData.clients?.length || 0} active client accounts evaluated for payment timeliness.`,
        confidence: 0.88,
      },
      debtBurden: {
        rawMetric: dti,
        normalizedMetric: Math.max(0, Math.round((1.0 - Math.min(1.0, dti / 50)) * 100) / 100),
        weight: weights.debtBurden,
        score: scoreDebt,
        max: weights.debtBurden,
        label: "Debt Burden",
        details: `${dti}% Debt-to-Income`,
        reason: `Debt-to-Income (DTI) ratio is ${dti}% of monthly recurring earnings.`,
        confidence: 0.93,
      },
      clientConcentration: {
        rawMetric: topClientPct,
        normalizedMetric: Math.max(0, Math.round((1.0 - Math.min(1.0, topClientPct / 100)) * 100) / 100),
        weight: weights.clientConcentration,
        score: scoreConcentration,
        max: weights.clientConcentration,
        label: "Client Concentration",
        details: `${topClientPct}% max client share`,
        reason: `Largest client represents ${topClientPct}% of total earnings.`,
        confidence: 0.90,
      },
      taxReserveCoverage: {
        rawMetric: taxReserve.recommendedReserveAmount,
        normalizedMetric: Math.round((scoreTaxReserve / weights.taxReserveCoverage) * 100) / 100,
        weight: weights.taxReserveCoverage,
        score: scoreTaxReserve,
        max: weights.taxReserveCoverage,
        label: "Tax Reserve Coverage",
        details: "Sec 44ADA / New Regime Reserve",
        reason: `Tax provision active with ${taxReserve.reservePercentage}% recommended reserve.`,
        confidence: 0.95,
      },
    },
    improvements,
    summary: `Financial Health Score: ${totalScore}/100 (${grade}). ${improvements[0] || "Your financial foundation is robust and well-diversified."}`,
  };

  return overallResult;
};

module.exports = {
  calculateDetailedHealthScore,
  DEFAULT_WEIGHTS,
};
