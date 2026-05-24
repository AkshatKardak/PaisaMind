const mongoose = require("mongoose");

const Expense = require("../models/Expense");

const buildDateFilter = (month, year) => {
  if (!month || !year) return {};

  const start = new Date(Number(year), Number(month) - 1, 1);
  const end = new Date(Number(year), Number(month), 1);
  return { date: { $gte: start, $lt: end } };
};

const getExpenses = async (req, res, next) => {
  try {
    const filters = {
      userId: req.user._id,
      ...buildDateFilter(req.query.month, req.query.year),
      ...(req.query.category ? { category: req.query.category } : {}),
    };

    const expenses = await Expense.find(filters).sort({ date: -1, createdAt: -1 });
    res.json({ success: true, expenses });
  } catch (error) {
    next(error);
  }
};

const addExpense = async (req, res, next) => {
  try {
    const expense = await Expense.create({
      ...req.body,
      userId: req.user._id,
    });

    res.status(201).json({ success: true, expense });
  } catch (error) {
    next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!expense) {
      res.status(404);
      throw new Error("Expense not found");
    }

    res.json({ success: true, expense });
  } catch (error) {
    next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!expense) {
      res.status(404);
      throw new Error("Expense not found");
    }

    res.json({ success: true, message: "Expense deleted" });
  } catch (error) {
    next(error);
  }
};

const getExpenseSummary = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const summary = await Expense.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json({ success: true, summary });
  } catch (error) {
    next(error);
  }
};

const getSubscriptions = async (req, res, next) => {
  try {
    const expenses = await Expense.find({
      userId: req.user._id,
      isRecurring: true,
    }).sort({ amount: -1 });

    const now = new Date();
    const subscriptions = expenses.map((expense) => {
      const lastUsed = expense.lastUsed ? new Date(expense.lastUsed) : null;
      const daysUnused = lastUsed
        ? Math.floor((now - lastUsed) / (1000 * 60 * 60 * 24))
        : null;
      const flagged = daysUnused !== null && daysUnused > 30;

      return {
        ...expense.toObject(),
        daysUnused,
        flagged,
        monthlyBleed: expense.amount,
        annualBleed: expense.amount * 12,
      };
    });

    const flaggedItems = subscriptions.filter((item) => item.flagged);
    const monthlyBleed = flaggedItems.reduce((sum, item) => sum + item.monthlyBleed, 0);
    const annualBleed = flaggedItems.reduce((sum, item) => sum + item.annualBleed, 0);

    res.json({
      success: true,
      subscriptions,
      monthlyBleed,
      annualBleed,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
  getSubscriptions,
};
