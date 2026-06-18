const RecurringTransaction = require("../models/RecurringTransaction");

const getRecurring = async (req, res, next) => {
  try {
    const items = await RecurringTransaction.find({ userId: req.user._id }).sort({ nextRunAt: 1 });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
};

const createRecurring = async (req, res, next) => {
  try {
    const { type, title, category, amount, frequency, startDate, notes } = req.body;
    const nextRunAt = startDate && new Date(startDate) > new Date()
      ? new Date(startDate)
      : new Date();
    const item = await RecurringTransaction.create({
      userId: req.user._id,
      type, title, category,
      amount: Number(amount),
      frequency: frequency || "monthly",
      nextRunAt,
      notes: notes || "",
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
};

const updateRecurring = async (req, res, next) => {
  try {
    const item = await RecurringTransaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) { res.status(404); throw new Error("Not found"); }
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
};

const deleteRecurring = async (req, res, next) => {
  try {
    await RecurringTransaction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true });
  } catch (err) { next(err); }
};

module.exports = { getRecurring, createRecurring, updateRecurring, deleteRecurring };
