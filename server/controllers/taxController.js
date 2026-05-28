const asyncHandler = require("express-async-handler");
const Income = require("../models/Income");
const Expense = require("../models/Expense");
const User = require("../models/User");

const getTaxOverview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);

  const currentYear = new Date().getFullYear();
  const start = new Date(currentYear, 3, 1);
  const end = new Date(currentYear + 1, 2, 31, 23, 59, 59, 999);

  const incomes = await Income.find({ userId, date: { $gte: start, $lte: end } });
  const expenses = await Expense.find({ userId, date: { $gte: start, $lte: end } });

  const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const taxableIncome = Math.max(0, totalIncome - totalExpense);

  return res.status(200).json({
    success: true,
    data: {
      user: user ? { name: user.name, email: user.email } : null,
      totalIncome,
      totalExpense,
      taxableIncome,
      regime: user?.taxRegime || "new",
    },
  });
});

const compareTaxRegimes = asyncHandler(async (req, res) => {
  const { income = 0, deductions80C = 0, deductions80D = 0, hra = 0 } = req.body;

  const grossIncome = Number(income);
  const deductions = Number(deductions80C) + Number(deductions80D) + Number(hra);

  const oldTaxable = Math.max(0, grossIncome - deductions - 50000);
  const newTaxable = Math.max(0, grossIncome - 75000);

  const oldTax = oldTaxable <= 250000 ? 0 : oldTaxable * 0.1;
  const newTax = newTaxable <= 300000 ? 0 : newTaxable * 0.07;

  const better = oldTax < newTax ? "old" : "new";

  return res.status(200).json({
    success: true,
    data: {
      oldRegime: {
        taxableIncome: oldTaxable,
        estimatedTax: Math.round(oldTax),
      },
      newRegime: {
        taxableIncome: newTaxable,
        estimatedTax: Math.round(newTax),
      },
      recommended: better,
    },
  });
});

const getGSTProgress = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const startOfYear = new Date(new Date().getFullYear(), 3, 1);
  const incomes = await Income.find({ userId, date: { $gte: startOfYear } });

  const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const threshold = 2000000;
  const progress = Math.min(100, (totalIncome / threshold) * 100);

  return res.status(200).json({
    success: true,
    data: {
      totalIncome,
      threshold,
      progress: Math.round(progress),
      warning: totalIncome >= 1800000 ? "yellow" : "green",
      danger: totalIncome >= 1900000 ? "red" : null,
    },
  });
});

module.exports = {
  getTaxOverview,
  compareTaxRegimes,
  getGSTProgress,
};