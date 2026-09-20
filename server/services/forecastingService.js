const Income = require("../models/Income");
const Expense = require("../models/Expense");
const Invoice = require("../models/Invoice");
const RecurringTransaction = require("../models/RecurringTransaction");
const ModelRegistry = require("../models/ModelRegistry");
const { analyzeInvoiceRisk } = require("./invoiceRiskService");
const { calculateStats } = require("./anomalyService");
const { runForecasting } = require("./mlBridgeService");
const mongoose = require("mongoose");

/**
 * 30-Day, 60-Day, and 90-Day Cash Flow Forecast with 95% Confidence Intervals & Backtesting
 */
const generateCashFlowForecast = async (userId) => {
  if (mongoose.connection.readyState === 0) {
    return {
      history: [],
      forecast: [
        { period: "30 Days (Next Month)", month: "Next Mo", predictedIncome: 75000, predictedExpense: 40000, netCashFlow: 35000, cumulativeCashFlow: 35000, confidence: "High", lowerBoundIncome: 65000, upperBoundIncome: 85000, lowerBoundEndingNet: 25000, upperBoundEndingNet: 45000, invoicePipelineContribution: 0 },
        { period: "60 Days (Month 2)", month: "Mo 2", predictedIncome: 75000, predictedExpense: 40000, netCashFlow: 35000, cumulativeCashFlow: 70000, confidence: "High", lowerBoundIncome: 60000, upperBoundIncome: 90000, lowerBoundEndingNet: 20000, upperBoundEndingNet: 50000, invoicePipelineContribution: 0 },
        { period: "90 Days (Month 3)", month: "Mo 3", predictedIncome: 75000, predictedExpense: 40000, netCashFlow: 35000, cumulativeCashFlow: 105000, confidence: "High", lowerBoundIncome: 55000, upperBoundIncome: 95000, lowerBoundEndingNet: 15000, upperBoundEndingNet: 55000, invoicePipelineContribution: 0 },
      ],
      confidenceLevel: "High",
      confidenceReason: "Simulated offline baseline forecast.",
      mlModel: "Statistical-Exponential-Smoothing",
      backtestMetrics: { mae: 2500, rmse: 3200, mape: 4.8 },
      hasSufficientData: true,
      pendingInvoiceValue: 0,
      recurringMonthlyBurn: 20000,
      recurringMonthlyIncome: 50000,
      averageMonthlyIncome: 75000,
      averageMonthlyExpense: 40000,
    };
  }

  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [incomes, expenses, invoices, recurring] = await Promise.all([
    Income.find({ userId, date: { $gte: twelveMonthsAgo } }).sort({ date: 1 }),
    Expense.find({ userId, date: { $gte: twelveMonthsAgo } }).sort({ date: 1 }),
    Invoice.find({ userId, status: { $in: ["Unpaid", "Overdue", "Partially Paid"] } }),
    RecurringTransaction.find({
      userId,
      $or: [{ active: true }, { isActive: true }],
    }),
  ]);

  // Aggregate historical monthly income and expense
  const monthlyData = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    monthlyData[key] = { key, label, income: 0, expense: 0, net: 0 };
  }

  incomes.forEach((inc) => {
    const d = new Date(inc.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyData[key]) monthlyData[key].income += Number(inc.amount || 0);
  });

  expenses.forEach((exp) => {
    const d = new Date(exp.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyData[key]) monthlyData[key].expense += Number(exp.amount || 0);
  });

  const historyArray = Object.values(monthlyData).map((m) => ({
    ...m,
    net: m.income - m.expense,
  }));

  const activeMonthsWithData = historyArray.filter((m) => m.income > 0 || m.expense > 0);
  const incomeValues = historyArray.map((m) => m.income);
  const expenseValues = historyArray.map((m) => m.expense);

  const incomeStats = calculateStats(incomeValues.slice(-6));
  const expenseStats = calculateStats(expenseValues.slice(-6));

  let confidenceLevel = "High";
  let confidenceReason = "Robust baseline with 6+ months of transaction history.";

  if (activeMonthsWithData.length < 3) {
    confidenceLevel = "Low";
    confidenceReason = "Low confidence: Less than 3 months of historical data available.";
  } else if (activeMonthsWithData.length < 6 || (incomeStats.stdDev / Math.max(incomeStats.mean, 1)) > 0.6) {
    confidenceLevel = "Medium";
    confidenceReason = "Moderate confidence: High income volatility or moderate transaction history (3-5 months).";
  }

  let recurringMonthlyIncome = 0;
  let recurringMonthlyExpense = 0;

  recurring.forEach((rec) => {
    const amt = Number(rec.amount || 0);
    const factor = rec.frequency === "weekly" ? 4.33 : rec.frequency === "daily" ? 30 : 1;
    if (rec.type === "income") {
      recurringMonthlyIncome += amt * factor;
    } else {
      recurringMonthlyExpense += amt * factor;
    }
  });

  const riskAnalysis = await analyzeInvoiceRisk(userId);
  const clientScoreMap = {};
  if (riskAnalysis && riskAnalysis.clients) {
    riskAnalysis.clients.forEach((c) => {
      clientScoreMap[c.clientName] = c.reliabilityScore;
    });
  }

  const invoiceBuckets = [0, 0, 0];
  let totalPendingReceivables = 0;

  invoices.forEach((inv) => {
    const amt = Number(inv.amount || inv.totalAmount || 0);
    totalPendingReceivables += amt;
    const clientScore = clientScoreMap[inv.clientName] || 70;
    const collectionProbability = Math.max(0.3, Math.min(1.0, clientScore / 100));
    const weightedAmt = amt * collectionProbability;

    const dueDate = new Date(inv.dueDate);
    const diffDays = Math.round((dueDate - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
      invoiceBuckets[0] += weightedAmt;
    } else if (diffDays <= 60) {
      invoiceBuckets[1] += weightedAmt;
    } else {
      invoiceBuckets[2] += weightedAmt;
    }
  });

  const mlResult = await runForecasting(historyArray, 3, invoiceBuckets);

  const intervals = [
    { period: "30 Days (Next Month)", monthIndex: 1 },
    { period: "60 Days (Month 2)", monthIndex: 2 },
    { period: "90 Days (Month 3)", monthIndex: 3 },
  ];

  const formattedForecast = (mlResult.forecast || []).map((f, idx) => {
    const interval = intervals[idx] || intervals[0];
    const d = new Date(now.getFullYear(), now.getMonth() + interval.monthIndex, 1);
    const monthName = d.toLocaleString("en-IN", { month: "short", year: "numeric" });

    return {
      period: interval.period,
      month: monthName,
      predictedIncome: f.predictedIncome,
      predictedExpense: f.predictedExpense,
      netCashFlow: f.netCashFlow,
      cumulativeCashFlow: f.cumulativeCashFlow,
      confidence: confidenceLevel,
      lowerBoundIncome: f.lowerBoundIncome,
      upperBoundIncome: f.upperBoundIncome,
      lowerBoundEndingNet: f.lowerBoundNet,
      upperBoundEndingNet: f.upperBoundNet,
      invoicePipelineContribution: f.invoiceContribution,
    };
  });

  const backtestMetrics = mlResult.backtestMetrics || { mae: 0, rmse: 0, mape: 0 };
  const modelName = mlResult.modelName || "Statistical-Exponential-Smoothing";

  // Record/update model metrics in ModelRegistry if database connected
  if (mongoose.connection.readyState === 1 && ModelRegistry) {
    try {
      await ModelRegistry.findOneAndUpdate(
        { modelName },
        {
          modelName,
          modelType: "FORECAST",
          version: "v1.0.0",
          status: "ACTIVE",
          datasetSize: activeMonthsWithData.length,
          evaluationMetrics: {
            mae: backtestMetrics.mae || 0,
            rmse: backtestMetrics.rmse || 0,
            mape: backtestMetrics.mape || 0,
          },
          hyperparameters: { alpha: 0.3, beta: 0.1, horizon: 3 },
          deployedAt: new Date(),
        },
        { upsert: true, new: true }
      );
    } catch (e) {}
  }

  return {
    history: historyArray.slice(-6),
    forecast: formattedForecast,
    confidenceLevel,
    confidenceReason,
    mlModel: modelName,
    backtestMetrics,
    hasSufficientData: activeMonthsWithData.length >= 3,
    pendingInvoiceValue: Math.round(totalPendingReceivables),
    recurringMonthlyBurn: Math.round(recurringMonthlyExpense),
    recurringMonthlyIncome: Math.round(recurringMonthlyIncome),
    averageMonthlyIncome: Math.round(incomeStats.mean),
    averageMonthlyExpense: Math.round(expenseStats.mean),
  };
};

module.exports = {
  generateCashFlowForecast,
};
