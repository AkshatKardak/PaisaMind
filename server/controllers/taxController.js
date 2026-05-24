const Income = require("../models/Income");
const { calculateNewRegimeTax, calculateOldRegimeTax, getAdvanceTaxSchedule } = require("../utils/taxEngine");

const getYtdIncome = async (userId) => {
  const start = new Date(new Date().getFullYear(), 0, 1);
  const income = await Income.find({
    userId,
    date: { $gte: start },
  });

  return income.reduce((sum, item) => sum + item.amount, 0);
};

const getGSTStatus = async (req, res, next) => {
  try {
    const ytdIncome = await getYtdIncome(req.user._id);
    const threshold = 2000000;
    const percentage = Number(((ytdIncome / threshold) * 100).toFixed(2));

    res.json({
      success: true,
      ytdIncome,
      threshold,
      percentage,
      warningTriggered: ytdIncome > 1800000,
    });
  } catch (error) {
    next(error);
  }
};

const compareRegime = async (req, res, next) => {
  try {
    const income = Number(req.body.income || 0);
    const deductions = {
      section80C: Number(req.body.section80C || 0),
      section80D: Number(req.body.section80D || 0),
      hra: Number(req.body.hra || 0),
    };

    const oldRegime = calculateOldRegimeTax(income, deductions);
    const newRegime = calculateNewRegimeTax(income);
    const better = oldRegime.totalTax < newRegime.totalTax ? oldRegime : newRegime;
    const savings = Math.abs(oldRegime.totalTax - newRegime.totalTax);

    res.json({
      success: true,
      comparison: {
        oldRegime,
        newRegime,
        recommendation: {
          regime: better.regime,
          savings,
          reason: better.regime === "old"
            ? "Your declared deductions reduce taxable income more effectively."
            : "The new regime results in lower tax with simpler compliance.",
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAdvanceTax = async (req, res, next) => {
  try {
    const annualIncome = await getYtdIncome(req.user._id) * (12 / Math.max(new Date().getMonth() + 1, 1));
    const annualTax = req.user.taxRegime === "old"
      ? calculateOldRegimeTax(annualIncome, {}).totalTax
      : calculateNewRegimeTax(annualIncome).totalTax;

    const schedule = getAdvanceTaxSchedule(annualTax);

    res.json({
      success: true,
      estimatedAnnualIncome: Number(annualIncome.toFixed(2)),
      estimatedAnnualTax: annualTax,
      schedule,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGSTStatus,
  compareRegime,
  getAdvanceTax,
};
