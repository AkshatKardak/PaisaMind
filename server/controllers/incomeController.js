const mongoose = require("mongoose");

const Income = require("../models/Income");

const buildDateFilter = (month, year) => {
  if (!month || !year) return {};

  const start = new Date(Number(year), Number(month) - 1, 1);
  const end = new Date(Number(year), Number(month), 1);

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
    const income = await Income.create({
      ...req.body,
      userId: req.user._id,
    });

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

    if (!income) {
      res.status(404);
      throw new Error("Income entry not found");
    }

    res.json({ success: true, income });
  } catch (error) {
    next(error);
  }
};

const deleteIncome = async (req, res, next) => {
  try {
    const income = await Income.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!income) {
      res.status(404);
      throw new Error("Income entry not found");
    }

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
      {
        $match: {
          userId,
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({ success: true, summary });
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
};
