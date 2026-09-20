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
const { getFinancialYearFromDate } = require("../services/taxRuleResolver");

const getTaxOverview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);

  const currentYear = new Date().getFullYear();
  const fyStart = new Date(new Date().getMonth() >= 3 ? currentYear : currentYear - 1, 3, 1);
  const fyEnd = new Date(new Date().getMonth() >= 3 ? currentYear + 1 : currentYear, 2, 31, 23, 59, 59, 999);
  const activeFy = req.query.financialYear || getFinancialYearFromDate(new Date());

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

  const comparison = await compareAllRegimes(totalIncome, totalExpense, deductions, {
    financialYear: activeFy,
    taxpayerType: user?.taxpayerType || "INDIVIDUAL",
    profession: user?.profession || "INFORMATION_TECHNOLOGY",
  });

  const advanceTax = await computeAdvanceTaxSchedule(comparison.recommendedOption.tax, 0, activeFy);
  const gst = await calculateGSTStatus(totalIncome, user?.isGstRegistered || false, activeFy);
  const reserve = await calculateRecommendedTaxReserve({
    ytdIncome: totalIncome,
    regime: user?.taxRegime || "new",
    use44ADA: true,
    deductions,
    financialYear: activeFy,
  });

  return res.status(200).json({
    success: true,
    data: {
      user: user ? { name: user.name, email: user.email, taxRegime: user.taxRegime } : null,
      financialYear: activeFy,
      ruleVersion: comparison.ruleVersion,
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
  const {
    income = 0,
    eligibleExpenses = 0,
    deductions80C = 0,
    deductions80D = 0,
    hra = 0,
    financialYear = "2025-26",
    taxpayerType = "INDIVIDUAL",
    profession = "INFORMATION_TECHNOLOGY",
    cashReceipts = 0,
  } = req.body;

  const deductions = {
    section80C: Number(deductions80C || 0),
    section80D: Number(deductions80D || 0),
    hra: Number(hra || 0),
  };

  const comparison = await compareAllRegimes(
    Number(income),
    Number(eligibleExpenses),
    deductions,
    { financialYear, taxpayerType, profession, cashReceipts: Number(cashReceipts) }
  );

  return res.status(200).json({ success: true, data: comparison });
});

const getGSTProgress = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(new Date().getMonth() >= 3 ? currentYear : currentYear - 1, 3, 1);
  const activeFy = req.query.financialYear || getFinancialYearFromDate(new Date());

  const [incomes, user] = await Promise.all([
    Income.find({ userId, date: { $gte: startOfYear } }),
    User.findById(userId),
  ]);

  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const gstStatus = await calculateGSTStatus(totalIncome, user?.isGstRegistered || false, activeFy);

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
      ruleVersion: gstStatus.ruleVersion,
    },
  });
});

const getAdvanceTax = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const currentYear = new Date().getFullYear();
  const fyStart = new Date(new Date().getMonth() >= 3 ? currentYear : currentYear - 1, 3, 1);
  const fyEnd = new Date(new Date().getMonth() >= 3 ? currentYear + 1 : currentYear, 2, 31, 23, 59, 59, 999);
  const activeFy = req.query.financialYear || getFinancialYearFromDate(new Date());

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

  const comparison = await compareAllRegimes(totalIncome, totalExpense, deductions, { financialYear: activeFy });
  const advanceTax = await computeAdvanceTaxSchedule(comparison.recommendedOption.tax, 0, activeFy);

  return res.status(200).json({
    success: true,
    data: advanceTax,
  });
});

const getTaxReserveEstimate = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { amount = 0, financialYear } = req.query;

  const currentYear = new Date().getFullYear();
  const fyStart = new Date(new Date().getMonth() >= 3 ? currentYear : currentYear - 1, 3, 1);
  const activeFy = financialYear || getFinancialYearFromDate(new Date());

  const [incomes, user] = await Promise.all([
    Income.find({ userId, date: { $gte: fyStart } }),
    User.findById(userId),
  ]);

  const ytdIncome = incomes.reduce((s, i) => s + Number(i.amount || 0), 0);

  const reserve = await calculateRecommendedTaxReserve({
    ytdIncome,
    newIncomeAmount: Number(amount),
    regime: user?.taxRegime || "new",
    use44ADA: true,
    deductions: {
      section80C: user?.investments80C || 0,
      section80D: user?.investments80D || 0,
    },
    financialYear: activeFy,
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
