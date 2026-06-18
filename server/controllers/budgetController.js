const mongoose = require("mongoose");
const Budget  = require("../models/Budget");
const Expense = require("../models/Expense");

const CATEGORIES = ["Food", "Software", "Travel", "Internet", "Marketing", "Other"];

// GET /budgets?month=6&year=2026
const getBudgets = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const month  = Number(req.query.month  || new Date().getMonth() + 1);
    const year   = Number(req.query.year   || new Date().getFullYear());

    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 1);

    const spendAgg = await Expense.aggregate([
      { $match: { userId, date: { $gte: start, $lt: end } } },
      { $group: { _id: "$category", spent: { $sum: "$amount" } } },
    ]);
    const spendMap = spendAgg.reduce((m, i) => { m[i._id] = i.spent; return m; }, {});

    const budgets = await Budget.find({ userId: req.user._id, month, year });
    const budgetMap = budgets.reduce((m, b) => { m[b.category] = b; return m; }, {});

    const result = CATEGORIES.map((cat) => {
      const budget = budgetMap[cat] || null;
      const spent  = spendMap[cat]  || 0;
      const limit  = budget?.limit  || null;
      const pct    = limit ? Math.min(100, Math.round((spent / limit) * 100)) : null;
      return {
        category: cat,
        limit,
        spent,
        remaining: limit !== null ? Math.max(0, limit - spent) : null,
        percentage: pct,
        over: limit !== null && spent > limit,
        budgetId: budget?._id || null,
      };
    });

    res.json({ success: true, data: result, month, year });
  } catch (err) {
    next(err);
  }
};

// POST /budgets
const upsertBudget = async (req, res, next) => {
  try {
    const { category, limit, month, year } = req.body;
    const budget = await Budget.findOneAndUpdate(
      { userId: req.user._id, category, month: Number(month), year: Number(year) },
      { limit: Number(limit) },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ success: true, data: budget });
  } catch (err) {
    next(err);
  }
};

// DELETE /budgets/:id
const deleteBudget = async (req, res, next) => {
  try {
    await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { getBudgets, upsertBudget, deleteBudget };
