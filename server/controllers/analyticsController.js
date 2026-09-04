const asyncHandler = require("express-async-handler");
const { calculateCashRunway } = require("../services/runwayService");
const { generateCashFlowForecast } = require("../services/forecastingService");
const { detectSpendingAnomalies, detectDuplicates } = require("../services/anomalyService");
const { detectRecurringSubscriptions } = require("../services/recurringIntelligenceService");
const { analyzeIncomeVolatility } = require("../services/incomeVolatilityService");
const { analyzeInvoiceRisk } = require("../services/invoiceRiskService");
const { calculateDetailedHealthScore } = require("../services/healthEngineService");
const Income = require("../models/Income");
const Expense = require("../models/Expense");
const Anomaly = require("../models/Anomaly");
const { logAuditEvent } = require("../services/auditService");

const getFinancialSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();
  const month = Number(req.query.month) || (now.getMonth() + 1);
  const year = Number(req.query.year) || now.getFullYear();

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const [incomes, expenses, runway, health] = await Promise.all([
    Income.find({ userId, date: { $gte: start, $lte: end } }),
    Expense.find({ userId, date: { $gte: start, $lte: end } }),
    calculateCashRunway(userId),
    calculateDetailedHealthScore(userId),
  ]);

  const totalIncome = incomes.reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalExpense = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const netSavings = totalIncome - totalExpense;

  return res.status(200).json({
    success: true,
    data: {
      month,
      year,
      totalIncome: Math.round(totalIncome),
      totalExpense: Math.round(totalExpense),
      netSavings: Math.round(netSavings),
      savingsRate: totalIncome > 0 ? Number(((netSavings / totalIncome) * 100).toFixed(1)) : 0,
      liquidCashBalance: runway.liquidCashBalance,
      cashRunwayMonths: runway.expectedRunwayMonths,
      financialHealthScore: health.totalScore,
      healthGrade: health.grade,
      runwayDisplay: runway.runwayDisplay,
    },
  });
});

const getFinancialHealth = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const health = await calculateDetailedHealthScore(userId);
  return res.status(200).json({ success: true, data: health });
});

const getAnomalies = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const months = Number(req.query.months) || 6;
  const anomaliesData = await detectSpendingAnomalies(userId, months);
  return res.status(200).json({ success: true, data: anomaliesData });
});

const getDuplicates = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const daysWindow = Number(req.query.daysWindow) || 3;
  const duplicates = await detectDuplicates(userId, daysWindow);
  return res.status(200).json({ success: true, data: duplicates });
});

const getRecurringIntelligence = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const subscriptions = await detectRecurringSubscriptions(userId);
  return res.status(200).json({ success: true, data: subscriptions });
});

const getIncomeVolatility = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const months = Number(req.query.months) || 6;
  const volatility = await analyzeIncomeVolatility(userId, months);
  return res.status(200).json({ success: true, data: volatility });
});

const getInvoiceRisk = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const invoiceRisk = await analyzeInvoiceRisk(userId);
  return res.status(200).json({ success: true, data: invoiceRisk });
});

const getCashRunway = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const runway = await calculateCashRunway(userId);
  return res.status(200).json({ success: true, data: runway });
});

const getCashflowForecast = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const forecast = await generateCashFlowForecast(userId);
  return res.status(200).json({ success: true, data: forecast });
});

const resolveDuplicate = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { action, transactionIdToKeep, transactionIdToDelete } = req.body;

  if (action === "delete_duplicate" && transactionIdToDelete) {
    await Expense.findOneAndDelete({ _id: transactionIdToDelete, userId });
    await logAuditEvent({
      userId,
      action: "DUPLICATE_RESOLVED",
      resource: "Expense",
      resourceId: transactionIdToDelete,
      details: { kept: transactionIdToKeep, deleted: transactionIdToDelete },
      req,
    });
  }

  return res.status(200).json({ success: true, message: "Duplicate resolved successfully." });
});

module.exports = {
  getFinancialSummary,
  getFinancialHealth,
  getAnomalies,
  getDuplicates,
  getRecurringIntelligence,
  getIncomeVolatility,
  getInvoiceRisk,
  getCashRunway,
  getCashflowForecast,
  resolveDuplicate,
};
