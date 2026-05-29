const asyncHandler = require("express-async-handler");
const Income  = require("../models/Income");
const Expense = require("../models/Expense");
const User    = require("../models/User");

const getTaxOverview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user   = await User.findById(userId);

  const currentYear = new Date().getFullYear();
  const start = new Date(currentYear, 3, 1);
  const end   = new Date(currentYear + 1, 2, 31, 23, 59, 59, 999);

  const incomes  = await Income.find({ userId, date: { $gte: start, $lte: end } });
  const expenses = await Expense.find({ userId, date: { $gte: start, $lte: end } });

  const totalIncome  = incomes.reduce((sum, i) => sum + Number(i.amount  || 0), 0);
  const totalExpense = expenses.reduce((sum, i) => sum + Number(i.amount || 0), 0);
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
  const deductions  = Number(deductions80C) + Number(deductions80D) + Number(hra);

  const oldTaxable = Math.max(0, grossIncome - deductions - 50000);
  const newTaxable = Math.max(0, grossIncome - 75000);

  const oldTax = oldTaxable <= 250000 ? 0 : oldTaxable * 0.1;
  const newTax = newTaxable <= 300000 ? 0 : newTaxable * 0.07;

  const better = oldTax < newTax ? "old" : "new";

  return res.status(200).json({
    success: true,
    data: {
      oldRegime: { taxableIncome: oldTaxable, estimatedTax: Math.round(oldTax) },
      newRegime: { taxableIncome: newTaxable, estimatedTax: Math.round(newTax) },
      recommended: better,
    },
  });
});

const getGSTProgress = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const startOfYear = new Date(new Date().getFullYear(), 3, 1);
  const incomes = await Income.find({ userId, date: { $gte: startOfYear } });

  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const threshold   = 2000000;
  const progress    = Math.min(100, (totalIncome / threshold) * 100);

  return res.status(200).json({
    success: true,
    data: {
      totalIncome,
      threshold,
      progress : Math.round(progress),
      warning  : totalIncome >= 1800000 ? "yellow" : "green",
      danger   : totalIncome >= 1900000 ? "red"    : null,
    },
  });
});

// Advance tax installment calculator for Indian freelancers (FY schedule)
const getAdvanceTax = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const currentYear  = new Date().getFullYear();
  const fyStart      = new Date(currentYear, 3, 1);   // April 1
  const fyEnd        = new Date(currentYear + 1, 2, 31, 23, 59, 59, 999); // March 31

  const incomes  = await Income.find({ userId, date: { $gte: fyStart, $lte: fyEnd } });
  const expenses = await Expense.find({ userId, date: { $gte: fyStart, $lte: fyEnd } });
  const user     = await User.findById(userId);

  const totalIncome  = incomes.reduce((sum, i) => sum + Number(i.amount  || 0), 0);
  const totalExpense = expenses.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const taxableIncome = Math.max(0, totalIncome - totalExpense);

  // Simplified new-regime slab calculation
  let annualTax = 0;
  if (taxableIncome > 300000) {
    if (taxableIncome <= 600000)  annualTax = (taxableIncome - 300000) * 0.05;
    else if (taxableIncome <= 900000)  annualTax = 15000 + (taxableIncome - 600000) * 0.10;
    else if (taxableIncome <= 1200000) annualTax = 45000 + (taxableIncome - 900000) * 0.15;
    else if (taxableIncome <= 1500000) annualTax = 90000 + (taxableIncome - 1200000) * 0.20;
    else annualTax = 150000 + (taxableIncome - 1500000) * 0.30;
  }
  annualTax = Math.round(annualTax);

  // Advance tax is due only if liability > ₹10,000
  const isDue = annualTax > 10000;

  const installments = isDue
    ? [
        { quarter: "Q1", due: "15 Jun", percent: 15, amount: Math.round(annualTax * 0.15) },
        { quarter: "Q2", due: "15 Sep", percent: 45, amount: Math.round(annualTax * 0.45) },
        { quarter: "Q3", due: "15 Dec", percent: 75, amount: Math.round(annualTax * 0.75) },
        { quarter: "Q4", due: "15 Mar", percent: 100, amount: annualTax },
      ]
    : [];

  return res.status(200).json({
    success: true,
    data: {
      taxableIncome,
      annualTax,
      isDue,
      regime: user?.taxRegime || "new",
      installments,
      note: isDue
        ? "Pay each installment by the due date to avoid interest under Section 234B/234C."
        : "No advance tax due — estimated liability is below ₹10,000.",
    },
  });
});

module.exports = {
  getTaxOverview,
  compareTaxRegimes,
  getGSTProgress,
  getAdvanceTax,
};
