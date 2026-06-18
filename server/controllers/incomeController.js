const mongoose = require("mongoose");
const Income   = require("../models/Income");

const buildDateFilter = (month, year) => {
  if (!month || !year) return {};
  const start = new Date(Number(year), Number(month) - 1, 1);
  const end   = new Date(Number(year), Number(month), 1);
  return { date: { $gte: start, $lt: end } };
};

const getIncome = async (req, res, next) => {
  try {
    const filters = {
      userId: req.user._id,
      ...buildDateFilter(req.query.month, req.query.year),
    };
    const income = await Income.find(filters).sort({ date: -1, createdAt: -1 });
    res.json({ success: true, income });
  } catch (error) {
    next(error);
  }
};

const addIncome = async (req, res, next) => {
  try {
    const income = await Income.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, income });
  } catch (error) {
    next(error);
  }
};

const updateIncome = async (req, res, next) => {
  try {
    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!income) { res.status(404); throw new Error("Income entry not found"); }
    res.json({ success: true, income });
  } catch (error) {
    next(error);
  }
};

const deleteIncome = async (req, res, next) => {
  try {
    const income = await Income.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!income) { res.status(404); throw new Error("Income entry not found"); }
    res.json({ success: true, message: "Income deleted" });
  } catch (error) {
    next(error);
  }
};

const getIncomeSummary = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const summary = await Income.aggregate([
      { $match: { userId, date: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: "$date" }, month: { $month: "$date" } }, total: { $sum: "$amount" } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
    res.json({ success: true, summary });
  } catch (error) {
    next(error);
  }
};

// ─── GST Annual Summary ──────────────────────────────────────────────────────
// Returns total income for the current Indian financial year (Apr 1 → Mar 31)
// and the GST registration threshold so the frontend can show a progress widget.
const getGSTStatus = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const now    = new Date();

    // Indian FY: Apr 1 of this year if we're past April, else Apr 1 of last year
    const fyStart = now.getMonth() >= 3
      ? new Date(now.getFullYear(), 3, 1)          // Apr 1 this year
      : new Date(now.getFullYear() - 1, 3, 1);     // Apr 1 last year
    const fyEnd = new Date(fyStart.getFullYear() + 1, 2, 31, 23, 59, 59, 999); // Mar 31

    const result = await Income.aggregate([
      { $match: { userId, date: { $gte: fyStart, $lte: fyEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const GST_THRESHOLD    = 2000000;  // ₹20,00,000
    const annualRevenue    = result[0]?.total || 0;
    const percentage       = Math.min(100, Math.round((annualRevenue / GST_THRESHOLD) * 100));
    const fyLabel          = `FY ${fyStart.getFullYear()}-${String(fyEnd.getFullYear()).slice(2)}`;

    res.json({
      success: true,
      data: {
        annualRevenue,
        threshold:   GST_THRESHOLD,
        percentage,
        fyLabel,
        warning:     percentage >= 80,
        registered:  annualRevenue >= GST_THRESHOLD,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getIncome,
  addIncome,
  updateIncome,
  deleteIncome,
  getIncomeSummary,
  getGSTStatus,
};
