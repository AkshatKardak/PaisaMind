const Asset = require("../models/Asset");
const Liability = require("../models/Liability");
const Income = require("../models/Income");
const Expense = require("../models/Expense");
const Invoice = require("../models/Invoice");

/**
 * Calculates Net Worth, Asset breakdown, Debt-to-Income (DTI), and upcoming EMI pressure
 */
const calculateNetWorthAndDebt = async (userId) => {
  const [assets, liabilities, recentIncomes, unpaidInvoices] = await Promise.all([
    Asset.find({ userId }).sort({ amount: -1 }),
    Liability.find({ userId }).sort({ currentBalance: -1 }),
    Income.find({ userId }).sort({ date: -1 }).limit(100),
    Invoice.find({ userId, status: { $in: ["Unpaid", "Partially Paid"] } }),
  ]);

  // 1. Assets Calculation
  let totalExplicitAssets = assets.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  let totalReceivables = unpaidInvoices.reduce((sum, i) => sum + Number(i.amount || i.totalAmount || 0), 0);

  // If no assets were manually logged, derive liquid cash from income vs expense
  let derivedLiquidCash = 0;
  if (assets.length === 0) {
    const allExpenses = await Expense.find({ userId });
    const totalIn = recentIncomes.reduce((s, i) => s + Number(i.amount || 0), 0);
    const totalOut = allExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    derivedLiquidCash = Math.max(0, totalIn - totalOut);
  }

  const totalAssets = totalExplicitAssets > 0
    ? totalExplicitAssets + totalReceivables
    : derivedLiquidCash + totalReceivables;

  // 2. Liabilities Calculation
  const totalLiabilities = liabilities.reduce((sum, l) => sum + Number(l.currentBalance || 0), 0);
  const totalMonthlyEmi = liabilities.reduce((sum, l) => sum + Number(l.monthlyEmi || 0), 0);

  // 3. Net Worth
  const netWorth = totalAssets - totalLiabilities;

  // 4. Debt-to-Income (DTI) Ratio
  const recent3MonthsIncome = recentIncomes.slice(0, 30).reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const estimatedMonthlyIncome = recent3MonthsIncome > 0 ? (recent3MonthsIncome / 3) : 50000;
  const dtiPercentage = estimatedMonthlyIncome > 0
    ? Number(((totalMonthlyEmi / estimatedMonthlyIncome) * 100).toFixed(1))
    : 0;

  let dtiRisk = "HEALTHY";
  if (dtiPercentage > 40) dtiRisk = "HIGH";
  else if (dtiPercentage > 25) dtiRisk = "MODERATE";

  // 5. Detect Upcoming EMI Pressure (EMIs due in next 7 days)
  const now = new Date();
  const next7Days = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
  const upcomingEmis = liabilities
    .filter((l) => l.nextPaymentDate && new Date(l.nextPaymentDate) <= next7Days && new Date(l.nextPaymentDate) >= now)
    .map((l) => {
      const daysUntilDue = Math.ceil((new Date(l.nextPaymentDate) - now) / (1000 * 60 * 60 * 24));
      return {
        _id: l._id,
        name: l.name,
        monthlyEmi: l.monthlyEmi,
        nextPaymentDate: l.nextPaymentDate,
        daysUntilDue,
        lender: l.lender,
        projectedPostEmiBalance: Math.max(0, (totalExplicitAssets || derivedLiquidCash) - l.monthlyEmi),
      };
    });

  // Group Assets by Type
  const assetTypeMap = {};
  assets.forEach((a) => {
    assetTypeMap[a.type] = (assetTypeMap[a.type] || 0) + a.amount;
  });
  if (totalReceivables > 0) {
    assetTypeMap["receivable"] = totalReceivables;
  }
  if (assets.length === 0 && derivedLiquidCash > 0) {
    assetTypeMap["cash"] = derivedLiquidCash;
  }

  // Group Liabilities by Type
  const liabilityTypeMap = {};
  liabilities.forEach((l) => {
    liabilityTypeMap[l.type] = (liabilityTypeMap[l.type] || 0) + l.currentBalance;
  });

  return {
    netWorth: Math.round(netWorth),
    totalAssets: Math.round(totalAssets),
    totalLiabilities: Math.round(totalLiabilities),
    totalReceivables: Math.round(totalReceivables),
    totalMonthlyEmi: Math.round(totalMonthlyEmi),
    dtiPercentage,
    dtiRisk,
    estimatedMonthlyIncome: Math.round(estimatedMonthlyIncome),
    assets: assets,
    liabilities: liabilities,
    assetBreakdown: Object.entries(assetTypeMap).map(([type, amount]) => ({ type, amount: Math.round(amount) })),
    liabilityBreakdown: Object.entries(liabilityTypeMap).map(([type, amount]) => ({ type, amount: Math.round(amount) })),
    upcomingEmis,
    hasUpcomingEmiPressure: upcomingEmis.length > 0,
  };
};

module.exports = {
  calculateNetWorthAndDebt,
};
