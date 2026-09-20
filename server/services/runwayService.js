const Expense = require("../models/Expense");
const Income = require("../models/Income");
const Invoice = require("../models/Invoice");
const Asset = require("../models/Asset");
const Liability = require("../models/Liability");
const { calculateRecommendedTaxReserve } = require("./taxIntelligenceService");
const { analyzeInvoiceRisk } = require("./invoiceRiskService");
const { calculateStats } = require("./anomalyService");
const mongoose = require("mongoose");

/**
 * Calculates Cash Runway across Conservative, Expected, and Optimistic perspectives
 */
const calculateCashRunway = async (userId) => {
  if (mongoose.connection.readyState === 0) {
    return {
      liquidCashBalance: 150000,
      netAvailableCash: 130000,
      taxReserveDeduction: 20000,
      totalReceivables: 60000,
      highConfidenceReceivables: 50000,
      monthlyBurnRate: 40000,
      monthlyEmiObligations: 10000,
      conservativeRunwayMonths: 3.1,
      expectedRunwayMonths: 4.2,
      optimisticRunwayMonths: 5.5,
      runwayHealth: "MODERATE",
      runwayDisplay: "4.2 months",
      summary: "Simulated offline runway baseline: 4.2 months.",
    };
  }

  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const fyStart = new Date(now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1, 3, 1);

  const [expenses, incomes, invoices, liquidAssets, liabilities] = await Promise.all([
    Expense.find({ userId, date: { $gte: threeMonthsAgo } }),
    Income.find({ userId, date: { $gte: fyStart } }),
    Invoice.find({ userId, status: { $in: ["Unpaid", "Overdue", "Partially Paid"] } }),
    Asset.find({ userId, isLiquid: true }),
    Liability.find({ userId }),
  ]);

  // 1. Calculate Monthly Burn Rate & Expense Variability
  const monthlyExpenseMap = {};
  expenses.forEach((e) => {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    monthlyExpenseMap[key] = (monthlyExpenseMap[key] || 0) + Number(e.amount || 0);
  });
  const expenseValues = Object.values(monthlyExpenseMap);
  const expenseStats = calculateStats(expenseValues);

  const totalRecentExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const monthlyDiscretionaryBurn = totalRecentExpenses > 0 ? totalRecentExpenses / 3 : 0;
  const monthlyEmiObligations = liabilities.reduce((sum, l) => sum + Number(l.monthlyEmi || 0), 0);
  const baseMonthlyBurn = Math.max(1000, monthlyDiscretionaryBurn + monthlyEmiObligations);

  // Dynamic Conservative multiplier based on expense coefficient of variation (CV)
  const expenseCV = expenseStats.mean > 0 ? (expenseStats.stdDev / expenseStats.mean) : 0;
  const conservativeMultiplier = Math.min(1.20, Math.max(1.05, 1.0 + (expenseCV * 0.2)));

  // 2. Liquid Cash Balance
  let liquidCash = liquidAssets.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  if (liquidCash === 0) {
    const allIncomes = await Income.find({ userId });
    const allExpenses = await Expense.find({ userId });
    const totalIn = allIncomes.reduce((s, i) => s + Number(i.amount || 0), 0);
    const totalOut = allExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    liquidCash = Math.max(0, totalIn - totalOut);
  }

  // 3. Tax Reserve deduction estimate via dynamic tax intelligence
  const ytdIncome = incomes.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const taxReserveRes = await calculateRecommendedTaxReserve({
    ytdIncome,
    newIncomeAmount: 0,
    regime: "new",
    use44ADA: true,
  });
  const taxReserveEstimate = taxReserveRes.totalAnnualTaxProjected || 0;
  const netAvailableCash = Math.max(0, liquidCash - (taxReserveEstimate * 0.5));

  // 4. Receivables analysis
  const totalReceivables = invoices.reduce((sum, inv) => sum + Number(inv.amount || inv.totalAmount || 0), 0);
  const riskData = await analyzeInvoiceRisk(userId);
  const highConfidenceReceivables = invoices
    .filter((inv) => {
      const client = riskData.clients?.find((c) => c.clientName === inv.clientName);
      return !client || client.riskClassification !== "HIGH";
    })
    .reduce((sum, inv) => sum + Number(inv.amount || inv.totalAmount || 0), 0);

  // 5. Compute the 3 Runway Tiers (in Months)
  const conservativeBurn = baseMonthlyBurn * conservativeMultiplier;
  const conservativeRunwayMonths = Number((netAvailableCash / conservativeBurn).toFixed(1));

  const expectedAvailableFunds = netAvailableCash + (highConfidenceReceivables * 0.8);
  const expectedRunwayMonths = Number((expectedAvailableFunds / baseMonthlyBurn).toFixed(1));

  const optimisticFunds = netAvailableCash + totalReceivables;
  const optimizedBurn = Math.max(1000, (monthlyDiscretionaryBurn * 0.85) + monthlyEmiObligations);
  const optimisticRunwayMonths = Number((optimisticFunds / optimizedBurn).toFixed(1));

  let runwayHealth = "HEALTHY";
  if (expectedRunwayMonths < 3.0) runwayHealth = "CRITICAL";
  else if (expectedRunwayMonths < 6.0) runwayHealth = "MODERATE";

  return {
    liquidCashBalance: Math.round(liquidCash),
    netAvailableCash: Math.round(netAvailableCash),
    taxReserveDeduction: Math.round(taxReserveEstimate * 0.5),
    totalReceivables: Math.round(totalReceivables),
    highConfidenceReceivables: Math.round(highConfidenceReceivables),
    monthlyBurnRate: Math.round(baseMonthlyBurn),
    monthlyEmiObligations: Math.round(monthlyEmiObligations),
    conservativeMultiplier: Number(conservativeMultiplier.toFixed(2)),
    conservativeRunwayMonths,
    expectedRunwayMonths,
    optimisticRunwayMonths,
    runwayHealth,
    runwayDisplay: `${expectedRunwayMonths} months`,
    summary: `At current monthly burn of ₹${Math.round(baseMonthlyBurn).toLocaleString("en-IN")}, you have ${expectedRunwayMonths} months of runway (${conservativeRunwayMonths}m conservative, ${optimisticRunwayMonths}m optimistic).`,
  };
};

module.exports = {
  calculateCashRunway,
};
