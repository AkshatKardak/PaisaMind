const addCess = (tax) => Number((tax * 1.04).toFixed(2));

const slabTax = (taxableIncome, slabs) =>
  slabs.reduce((tax, slab) => {
    if (taxableIncome <= slab.min) {
      return tax;
    }

    const upper = typeof slab.max === "number" ? slab.max : taxableIncome;
    const taxablePart = Math.min(taxableIncome, upper) - slab.min;
    return taxablePart > 0 ? tax + taxablePart * slab.rate : tax;
  }, 0);

export const calculateNewRegimeTax = (income = 0) => {
  const taxableIncome = Math.max(0, Number(income) - 75000);
  const tax = slabTax(taxableIncome, [
    { min: 0, max: 300000, rate: 0 },
    { min: 300000, max: 700000, rate: 0.05 },
    { min: 700000, max: 1000000, rate: 0.1 },
    { min: 1000000, max: 1200000, rate: 0.15 },
    { min: 1200000, max: 1500000, rate: 0.2 },
    { min: 1500000, max: null, rate: 0.3 },
  ]);

  return {
    taxableIncome,
    taxBeforeCess: Number(tax.toFixed(2)),
    totalTax: addCess(tax),
  };
};

export const calculateOldRegimeTax = (income = 0, deductions = {}) => {
  const deduction80C = Math.min(Number(deductions.section80C || 0), 150000);
  const deduction80D = Math.min(Number(deductions.section80D || 0), 25000);
  const hra = Number(deductions.hra || 0);
  const taxableIncome = Math.max(0, Number(income) - 50000 - deduction80C - deduction80D - hra);
  const tax = slabTax(taxableIncome, [
    { min: 0, max: 250000, rate: 0 },
    { min: 250000, max: 500000, rate: 0.05 },
    { min: 500000, max: 1000000, rate: 0.2 },
    { min: 1000000, max: null, rate: 0.3 },
  ]);

  return {
    taxableIncome,
    taxBeforeCess: Number(tax.toFixed(2)),
    totalTax: addCess(tax),
  };
};

export const getTaxComparison = (income, deductions) => {
  const oldRegime = calculateOldRegimeTax(income, deductions);
  const newRegime = calculateNewRegimeTax(income);
  return {
    oldRegime,
    newRegime,
    better: oldRegime.totalTax < newRegime.totalTax ? "old" : "new",
    savings: Math.abs(oldRegime.totalTax - newRegime.totalTax),
  };
};
