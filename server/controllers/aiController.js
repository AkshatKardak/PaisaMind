const Expense = require("../models/Expense");
const Goal = require("../models/Goal");
const Income = require("../models/Income");
const Invoice = require("../models/Invoice");
const {
  generateInsights,
  generateMonthlyReport,
  generateInvoiceReminder,
} = require("../utils/groqService");

const getMonthWindow = (month, year) => {
  const current = new Date();
  const selectedMonth = Number(month || current.getMonth() + 1);
  const selectedYear = Number(year || current.getFullYear());
  const start = new Date(selectedYear, selectedMonth - 1, 1);
  const end = new Date(selectedYear, selectedMonth, 1);
  return { start, end, month: selectedMonth, year: selectedYear };
};

const getInsights = async (req, res, next) => {
  try {
    const { start, end } = getMonthWindow();
    const [income, expenses, invoices, goals] = await Promise.all([
      Income.find({ userId: req.user._id, date: { $gte: start, $lt: end } }),
      Expense.find({ userId: req.user._id, date: { $gte: start, $lt: end } }),
      Invoice.find({ userId: req.user._id, createdAt: { $gte: start, $lt: end } }),
      Goal.find({ userId: req.user._id }),
    ]);

    const insights = await generateInsights({ income, expenses, invoices, goals });
    res.json({ success: true, ...insights });
  } catch (error) {
    next(error);
  }
};

const getMonthlyReport = async (req, res, next) => {
  try {
    const { start, end, month, year } = getMonthWindow(req.body.month, req.body.year);
    const [income, expenses, invoices, goals] = await Promise.all([
      Income.find({ userId: req.user._id, date: { $gte: start, $lt: end } }),
      Expense.find({ userId: req.user._id, date: { $gte: start, $lt: end } }),
      Invoice.find({ userId: req.user._id, createdAt: { $gte: start, $lt: end } }),
      Goal.find({ userId: req.user._id }),
    ]);

    const report = await generateMonthlyReport({ month, year, income, expenses, invoices, goals });
    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

const getInvoiceReminder = async (req, res, next) => {
  try {
    const { invoiceId, tone } = req.body;
    const invoice = await Invoice.findOne({ _id: invoiceId, userId: req.user._id });

    if (!invoice) {
      res.status(404);
      throw new Error("Invoice not found");
    }

    const message = await generateInvoiceReminder(invoice, tone);
    res.json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInsights,
  getMonthlyReport,
  getInvoiceReminder,
};
