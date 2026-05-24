const Goal = require("../models/Goal");
const { sendGoalCompletedEmail } = require("../utils/emailService");

const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ userId: req.user._id }).sort({ deadline: 1 });
    res.json({ success: true, goals });
  } catch (error) {
    next(error);
  }
};

const createGoal = async (req, res, next) => {
  try {
    const goal = await Goal.create({
      ...req.body,
      userId: req.user._id,
    });

    res.status(201).json({ success: true, goal });
  } catch (error) {
    next(error);
  }
};

const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!goal) {
      res.status(404);
      throw new Error("Goal not found");
    }

    res.json({ success: true, goal });
  } catch (error) {
    next(error);
  }
};

const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!goal) {
      res.status(404);
      throw new Error("Goal not found");
    }

    res.json({ success: true, message: "Goal deleted" });
  } catch (error) {
    next(error);
  }
};

const updateProgress = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { savedAmount: Number(req.body.savedAmount || 0) },
      { new: true, runValidators: true }
    );

    if (!goal) {
      res.status(404);
      throw new Error("Goal not found");
    }

    if (goal.savedAmount >= goal.targetAmount) {
      await sendGoalCompletedEmail(req.user.email, req.user.name, goal.name, goal.savedAmount);
    }

    res.json({ success: true, goal });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  updateProgress,
};
