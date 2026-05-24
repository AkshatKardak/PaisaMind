const roundAmount = (value) => Number(Math.max(value, 0).toFixed(2));

const applySlabs = (taxableIncome, slabs) => {
  let remaining = taxableIncome;
  let previousLimit = 0;
  let tax = 0;

  for (const slab of slabs) {
    if (remaining <= 0) break;

    const upperLimit = slab.limit;
    const applicableAmount = upperLimit === Infinity
      ? remaining
      : Math.min(remaining, upperLimit - previousLimit);

    tax += applicableAmount * slab.rate;
    remaining -= applicableAmount;
    previousLimit = upperLimit;
  }

  return tax;
};

const calculateNewRegimeTax = (income = 0) => {
  const taxableIncome = Math.max(income - 75000, 0);
  const tax = applySlabs(taxableIncome, [
    { limit: 300000, rate: 0 },
    { limit: 700000, rate: 0.05 },
    { limit: 1000000, rate: 0.1 },
    { limit: 1200000, rate: 0.15 },
    { limit: 1500000, rate: 0.2 },
    { limit: Infinity, rate: 0.3 },
  ]);
  const cess = tax * 0.04;

  return {
    regime: "new",
    grossIncome: roundAmount(income),
    standardDeduction: 75000,
    taxableIncome: roundAmount(taxableIncome),
    taxBeforeCess: roundAmount(tax),
    cess: roundAmount(cess),
    totalTax: roundAmount(tax + cess),
  };
};

const calculateOldRegimeTax = (income = 0, deductions = {}) => {
  const deduction80C = Math.min(Number(deductions.section80C || 0), 150000);
  const deduction80D = Math.min(Number(deductions.section80D || 0), 25000);
  const hra = Number(deductions.hra || 0);
  const totalDeductions = deduction80C + deduction80D + hra + 50000;
  const taxableIncome = Math.max(income - totalDeductions, 0);
  const tax = applySlabs(taxableIncome, [
    { limit: 250000, rate: 0 },
    { limit: 500000, rate: 0.05 },
    { limit: 1000000, rate: 0.2 },
    { limit: Infinity, rate: 0.3 },
  ]);
  const cess = tax * 0.04;

  return {
    regime: "old",
    grossIncome: roundAmount(income),
    standardDeduction: 50000,
    deductions: {
      section80C: roundAmount(deduction80C),
      section80D: roundAmount(deduction80D),
      hra: roundAmount(hra),
      total: roundAmount(totalDeductions),
    },
    taxableIncome: roundAmount(taxableIncome),
    taxBeforeCess: roundAmount(tax),
    cess: roundAmount(cess),
    totalTax: roundAmount(tax + cess),
  };
};

const getAdvanceTaxSchedule = (annualTax = 0) => {
  const today = new Date();
  const year = today.getMonth() > 2 ? today.getFullYear() : today.getFullYear() - 1;
  const schedule = [
    { quarter: "Q1", deadline: new Date(year, 5, 15), percentage: 15 },
    { quarter: "Q2", deadline: new Date(year, 8, 15), percentage: 45 },
    { quarter: "Q3", deadline: new Date(year, 11, 15), percentage: 75 },
    { quarter: "Q4", deadline: new Date(year + 1, 2, 15), percentage: 100 },
  ];

  return schedule.map((item) => {
    const amount = roundAmount((annualTax * item.percentage) / 100);
    const countdownDays = Math.ceil((item.deadline - today) / (1000 * 60 * 60 * 24));

    return {
      quarter: item.quarter,
      deadline: item.deadline,
      cumulativePercentage: item.percentage,
      amount,
      status: countdownDays < 0 ? "overdue" : countdownDays <= 14 ? "upcoming" : "pending",
      countdownDays,
    };
  });
};

module.exports = {
  calculateNewRegimeTax,
  calculateOldRegimeTax,
  getAdvanceTaxSchedule,
};
