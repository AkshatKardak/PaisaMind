const {
  computeNewRegimeTax,
  computeOldRegimeTax,
  computeAdvanceTaxSchedule,
} = require("../services/taxIntelligenceService");

const roundAmount = (value) => Number(Math.max(value, 0).toFixed(2));

const calculateNewRegimeTax = async (income = 0, financialYear = "2025-26") => {
  return computeNewRegimeTax(income, false, financialYear);
};

const calculateOldRegimeTax = async (income = 0, deductions = {}, financialYear = "2025-26") => {
  return computeOldRegimeTax(income, deductions, financialYear);
};

const getAdvanceTaxSchedule = async (annualTax = 0, financialYear = "2025-26") => {
  const result = await computeAdvanceTaxSchedule(annualTax, 0, financialYear);
  return result.installments.map((item) => ({
    quarter: item.quarter,
    deadline: item.dueDate,
    cumulativePercentage: item.cumulativePercentage,
    amount: item.cumulativeDueAmount,
    status: item.status === "passed" ? "overdue" : item.status === "due_soon" ? "upcoming" : "pending",
    countdownDays: item.daysLeft,
  }));
};

module.exports = {
  calculateNewRegimeTax,
  calculateOldRegimeTax,
  getAdvanceTaxSchedule,
  roundAmount,
};
