const asyncHandler = require("express-async-handler");
const Income = require("../models/Income");
const Expense = require("../models/Expense");
const User = require("../models/User");
const {
  compareAllRegimes,
  calculateGSTStatus,
  computeAdvanceTaxSchedule,
  calculateRecommendedTaxReserve,
} = require("../services/taxIntelligenceService");

const getTaxOverview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);

  const currentYear = new Date().getFullYear();
  const fyStart = new Date(new Date().getMonth() >= 3 ? currentYear : currentYear - 1, 3, 1);
  const fyEnd = new Date(new Date().getMonth() >= 3 ? currentYear + 1 : currentYear, 2, 31, 23, 59, 59, 999);

  const [incomes, expenses] = await Promise.all([
    Income.find({ userId, date: { $gte: fyStart, $lte: fyEnd } }),
    Expense.find({ userId, date: { $gte: fyStart, $lte: fyEnd } }),
  ]);

  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, i) => sum + Number(i.amount || 0), 0);

  const deductions = {
    section80C: user?.investments80C || 0,
    section80D: user?.investments80D || 0,
  };

  const comparison = compareAllRegimes(totalIncome, totalExpense, deductions);
  const advanceTax = computeAdvanceTaxSchedule(comparison.recommendedOption.tax);
  const gst = calculateGSTStatus(totalIncome);
  const reserve = calculateRecommendedTaxReserve({
    ytdIncome: totalIncome,
    regime: user?.taxRegime || "new",
    use44ADA: true,
    deductions,
  });

  return res.status(200).json({
    success: true,
    data: {
      user: user ? { name: user.name, email: user.email, taxRegime: user.taxRegime } : null,
      totalIncome: Math.round(totalIncome),
      totalExpense: Math.round(totalExpense),
      taxComparison: comparison,
      advanceTaxSchedule: advanceTax,
      gstStatus: gst,
      recommendedTaxReserve: reserve,
    },
  });
});

const compareTaxRegimes = asyncHandler(async (req, res) => {
  const { income = 0, eligibleExpenses = 0, deductions80C = 0, deductions80D = 0, hra = 0 } = req.body;

  const deductions = {
    section80C: Number(deductions80C || 0),
    section80D: Number(deductions80D || 0),
    hra: Number(hra || 0),
  };

  const comparison = compareAllRegimes(Number(income), Number(eligibleExpenses), deductions);
  return res.status(200).json({ success: true, data: comparison });
});

const getGSTProgress = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(new Date().getMonth() >= 3 ? currentYear : currentYear - 1, 3, 1);
  const incomes = await Income.find({ userId, date: { $gte: startOfYear } });

  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const gstStatus = calculateGSTStatus(totalIncome);

  return res.status(200).json({
    success: true,
    data: {
      totalIncome: Math.round(totalIncome),
      threshold: gstStatus.threshold,
      progress: gstStatus.progressPercent,
      remainingToThreshold: gstStatus.remainingToThreshold,
      status: gstStatus.status,
      warning: gstStatus.status === "warning" ? "yellow" : gstStatus.status === "danger" ? "red" : "green",
      alertMessage: gstStatus.alertMessage,
    },
  });
});

const getAdvanceTax = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const currentYear = new Date().getFullYear();
  const fyStart = new Date(new Date().getMonth() >= 3 ? currentYear : currentYear - 1, 3, 1);
  const fyEnd = new Date(new Date().getMonth() >= 3 ? currentYear + 1 : currentYear, 2, 31, 23, 59, 59, 999);

  const [incomes, expenses, user] = await Promise.all([
    Income.find({ userId, date: { $gte: fyStart, $lte: fyEnd } }),
    Expense.find({ userId, date: { $gte: fyStart, $lte: fyEnd } }),
    User.findById(userId),
  ]);

  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, i) => sum + Number(i.amount || 0), 0);

  const deductions = {
    section80C: user?.investments80C || 0,
    section80D: user?.investments80D || 0,
  };

  const comparison = compareAllRegimes(totalIncome, totalExpense, deductions);
  const advanceTax = computeAdvanceTaxSchedule(comparison.recommendedOption.tax);

  return res.status(200).json({
    success: true,
    data: advanceTax,
  });
});

const getTaxReserveEstimate = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { amount = 0 } = req.query;

  const currentYear = new Date().getFullYear();
  const fyStart = new Date(new Date().getMonth() >= 3 ? currentYear : currentYear - 1, 3, 1);
  const incomes = await Income.find({ userId, date: { $gte: fyStart } });
  const ytdIncome = incomes.reduce((s, i) => s + Number(i.amount || 0), 0);

  const user = await User.findById(userId);

  const reserve = calculateRecommendedTaxReserve({
    ytdIncome,
    newIncomeAmount: Number(amount),
    regime: user?.taxRegime || "new",
    use44ADA: true,
    deductions: {
      section80C: user?.investments80C || 0,
      section80D: user?.investments80D || 0,
    },
  });

  return res.status(200).json({ success: true, data: reserve });
});

module.exports = {
  getTaxOverview,
  compareTaxRegimes,
  getGSTProgress,
  getAdvanceTax,
  getTaxReserveEstimate,
};
