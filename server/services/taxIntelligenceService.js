const TAX_CONFIG = require("./taxConfig");

const roundAmount = (val) => Math.round(Number(val || 0));

/**
 * Calculates progressive tax across given slabs
 */
const calculateSlabTax = (taxableIncome, slabs) => {
  let remaining = Math.max(0, taxableIncome);
  let previousLimit = 0;
  let tax = 0;

  for (const slab of slabs) {
    if (remaining <= 0) break;
    const slabSpan = slab.limit === Infinity ? remaining : slab.limit - previousLimit;
    const applicable = Math.min(remaining, slabSpan);
    tax += applicable * slab.rate;
    remaining -= applicable;
    previousLimit = slab.limit;
  }

  return tax;
};

/**
 * Computes New Tax Regime calculation with Section 87A rebate & 4% Cess
 */
const computeNewRegimeTax = (grossIncome = 0, isSalaried = false) => {
  const gross = Math.max(0, Number(grossIncome));
  const stdDeduction = isSalaried ? TAX_CONFIG.newRegime.standardDeduction : 0;
  const taxableIncome = Math.max(0, gross - stdDeduction);

  let basicTax = calculateSlabTax(taxableIncome, TAX_CONFIG.newRegime.slabs);

  // Section 87A Rebate: if taxable income <= 7,00,000, tax liability is 0
  if (taxableIncome <= TAX_CONFIG.newRegime.rebate87ALimit) {
    basicTax = 0;
  }

  const cess = basicTax * TAX_CONFIG.cessRate;
  const totalTax = roundAmount(basicTax + cess);
  const effectiveRate = gross > 0 ? Number(((totalTax / gross) * 100).toFixed(2)) : 0;

  return {
    regime: "new",
    grossIncome: roundAmount(gross),
    standardDeduction: stdDeduction,
    taxableIncome: roundAmount(taxableIncome),
    taxBeforeCess: roundAmount(basicTax),
    cess: roundAmount(cess),
    totalTax,
    effectiveRate,
  };
};

/**
 * Computes Old Tax Regime calculation with 80C, 80D, HRA deductions
 */
const computeOldRegimeTax = (grossIncome = 0, deductions = {}) => {
  const gross = Math.max(0, Number(grossIncome));
  const d80C = Math.min(Number(deductions.section80C || 0), TAX_CONFIG.oldRegime.max80C);
  const d80D = Math.min(Number(deductions.section80D || 0), TAX_CONFIG.oldRegime.max80D_self + TAX_CONFIG.oldRegime.max80D_parents);
  const dNPS = Math.min(Number(deductions.section80CCD1B || 0), TAX_CONFIG.oldRegime.max80CCD1B);
  const hra = Number(deductions.hra || 0);
  const isSalaried = Boolean(deductions.isSalaried);
  const stdDeduction = isSalaried ? TAX_CONFIG.oldRegime.standardDeduction : 0;

  const totalDeductions = d80C + d80D + dNPS + hra + stdDeduction;
  const taxableIncome = Math.max(0, gross - totalDeductions);

  let basicTax = calculateSlabTax(taxableIncome, TAX_CONFIG.oldRegime.slabs);

  // Section 87A Rebate in Old Regime (taxable income <= 5,00,000)
  if (taxableIncome <= TAX_CONFIG.oldRegime.rebate87ALimit) {
    basicTax = 0;
  }

  const cess = basicTax * TAX_CONFIG.cessRate;
  const totalTax = roundAmount(basicTax + cess);
  const effectiveRate = gross > 0 ? Number(((totalTax / gross) * 100).toFixed(2)) : 0;

  return {
    regime: "old",
    grossIncome: roundAmount(gross),
    deductions: {
      section80C: roundAmount(d80C),
      section80D: roundAmount(d80D),
      section80CCD1B: roundAmount(dNPS),
      hra: roundAmount(hra),
      standardDeduction: stdDeduction,
      total: roundAmount(totalDeductions),
    },
    taxableIncome: roundAmount(taxableIncome),
    taxBeforeCess: roundAmount(basicTax),
    cess: roundAmount(cess),
    totalTax,
    effectiveRate,
  };
};

/**
 * Computes Section 44ADA Presumptive Taxation for Freelancers / Professionals
 * Under 44ADA, 50% of gross receipts is treated as net taxable profits.
 */
const compute44ADATax = (grossReceipts = 0, isNewRegime = true, deductions = {}) => {
  const gross = Math.max(0, Number(grossReceipts));
  const isEligible = gross <= TAX_CONFIG.section44ADA.grossReceiptsLimit;
  const deemedProfit = roundAmount(gross * TAX_CONFIG.section44ADA.presumptiveIncomeRate);

  let taxResult;
  if (isNewRegime) {
    taxResult = computeNewRegimeTax(deemedProfit, false);
  } else {
    taxResult = computeOldRegimeTax(deemedProfit, deductions);
  }

  return {
    isEligible,
    grossReceipts: roundAmount(gross),
    deemedProfit,
    presumptiveRate: "50%",
    ...taxResult,
    taxSavingsVsNormal: 0, // calculated in comparison
  };
};

/**
 * Compares Old Regime vs New Regime vs 44ADA for a user
 */
const compareAllRegimes = (grossIncome = 0, eligibleExpenses = 0, deductions = {}) => {
  const gross = Number(grossIncome);
  const normalNetIncome = Math.max(0, gross - Number(eligibleExpenses || 0));

  const normalNew = computeNewRegimeTax(normalNetIncome, false);
  const normalOld = computeOldRegimeTax(normalNetIncome, deductions);
  const presumptiveNew = compute44ADATax(gross, true, deductions);
  const presumptiveOld = compute44ADATax(gross, false, deductions);

  const options = [
    { name: "New Regime (Actual Expenses)", tax: normalNew.totalTax, taxableIncome: normalNew.taxableIncome, tag: "new_actual" },
    { name: "Old Regime (Actual Expenses + Deductions)", tax: normalOld.totalTax, taxableIncome: normalOld.taxableIncome, tag: "old_actual" },
  ];

  if (presumptiveNew.isEligible) {
    options.push({ name: "Section 44ADA (New Regime)", tax: presumptiveNew.totalTax, taxableIncome: presumptiveNew.taxableIncome, tag: "44ada_new" });
    options.push({ name: "Section 44ADA (Old Regime)", tax: presumptiveOld.totalTax, taxableIncome: presumptiveOld.taxableIncome, tag: "44ada_old" });
  }

  options.sort((a, b) => a.tax - b.tax);
  const best = options[0];

  return {
    grossIncome: roundAmount(gross),
    eligibleExpenses: roundAmount(eligibleExpenses),
    normalNew,
    normalOld,
    presumptiveNew,
    presumptiveOld,
    recommendedOption: best,
    annualTaxSavings: roundAmount(Math.max(...options.map((o) => o.tax)) - best.tax),
  };
};

/**
 * Recommends an exact Tax Reserve percentage and amount for an incoming payment
 */
const calculateRecommendedTaxReserve = ({
  annualProjectedIncome = 0,
  ytdIncome = 0,
  newIncomeAmount = 0,
  regime = "new",
  use44ADA = true,
  deductions = {},
}) => {
  const currentTotal = Number(ytdIncome);
  const nextTotal = currentTotal + Number(newIncomeAmount);

  // Compute total tax before and after new income
  let taxBefore = 0;
  let taxAfter = 0;

  if (use44ADA && nextTotal <= TAX_CONFIG.section44ADA.grossReceiptsLimit) {
    taxBefore = compute44ADATax(currentTotal, regime === "new", deductions).totalTax;
    taxAfter = compute44ADATax(nextTotal, regime === "new", deductions).totalTax;
  } else {
    taxBefore = regime === "new"
      ? computeNewRegimeTax(currentTotal, false).totalTax
      : computeOldRegimeTax(currentTotal, deductions).totalTax;
    taxAfter = regime === "new"
      ? computeNewRegimeTax(nextTotal, false).totalTax
      : computeOldRegimeTax(nextTotal, deductions).totalTax;
  }

  const marginalTax = Math.max(0, taxAfter - taxBefore);
  const marginalRate = newIncomeAmount > 0 ? (marginalTax / newIncomeAmount) : 0;
  // Recommend a minimum safe reserve of 15% for freelancers unless income is very low
  const safeReserveRate = Math.max(marginalRate, nextTotal > 700000 ? 0.15 : 0.0);
  const recommendedReserve = roundAmount(newIncomeAmount * safeReserveRate);

  return {
    incomeEventAmount: roundAmount(newIncomeAmount),
    ytdIncomeAfter: roundAmount(nextTotal),
    marginalTax: roundAmount(marginalTax),
    recommendedReserveAmount: recommendedReserve,
    reservePercentage: Math.round(safeReserveRate * 100),
    totalAnnualTaxProjected: roundAmount(taxAfter),
    explanation: `Based on ₹${roundAmount(nextTotal).toLocaleString("en-IN")} YTD income under ${regime.toUpperCase()} regime (${use44ADA ? "Sec 44ADA" : "Regular"}), reserve ~${Math.round(safeReserveRate * 100)}% (₹${recommendedReserve.toLocaleString("en-IN")}) for taxes.`,
  };
};

/**
 * Calculates GST threshold tracking & liability
 */
const calculateGSTStatus = (annualTurnover = 0, registered = false) => {
  const turnover = Number(annualTurnover || 0);
  const threshold = TAX_CONFIG.gst.servicesThreshold;
  const progressPercent = Math.min(100, Number(((turnover / threshold) * 100).toFixed(1)));

  let status = "safe";
  let alertMessage = `Turnover is ₹${turnover.toLocaleString("en-IN")} (${progressPercent}% of ₹20L threshold).`;

  if (turnover >= threshold) {
    status = "mandatory_registration";
    alertMessage = "You have crossed the ₹20 Lakh turnover threshold! GST registration is mandatory for service providers.";
  } else if (turnover >= TAX_CONFIG.gst.dangerThreshold) {
    status = "danger";
    alertMessage = `CRITICAL: You are at ₹${turnover.toLocaleString("en-IN")}, only ₹${(threshold - turnover).toLocaleString("en-IN")} away from mandatory GST registration!`;
  } else if (turnover >= TAX_CONFIG.gst.warningThreshold) {
    status = "warning";
    alertMessage = `Approaching GST threshold: ₹${(threshold - turnover).toLocaleString("en-IN")} remaining before mandatory registration.`;
  }

  return {
    annualTurnover: roundAmount(turnover),
    threshold,
    remainingToThreshold: Math.max(0, roundAmount(threshold - turnover)),
    progressPercent,
    status,
    alertMessage,
    isRegistered: Boolean(registered),
  };
};

/**
 * Calculates Indian Advance Tax schedule for the current financial year
 */
const computeAdvanceTaxSchedule = (annualEstimatedTax = 0, taxPaidSoFar = 0) => {
  const totalTax = Math.max(0, Number(annualEstimatedTax));
  const isLiable = totalTax > 10000; // Section 208: liable if annual tax > ₹10,000

  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();
  const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;

  let cumulativePaid = Number(taxPaidSoFar || 0);

  const installments = TAX_CONFIG.advanceTaxSchedule.map((item) => {
    const dueYear = item.nextYear ? fyStartYear + 1 : fyStartYear;
    const dueDate = new Date(dueYear, item.dueMonth, item.dueDay, 23, 59, 59);
    const cumulativeDue = roundAmount((totalTax * item.cumulativePercentage) / 100);
    const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

    let state = "upcoming";
    if (daysLeft < 0) state = "passed";
    else if (daysLeft <= 15) state = "due_soon";

    return {
      quarter: item.quarter,
      deadlineLabel: item.label,
      dueDate,
      daysLeft,
      cumulativePercentage: item.cumulativePercentage,
      cumulativeDueAmount: cumulativeDue,
      status: state,
    };
  });

  return {
    isLiable,
    annualEstimatedTax: totalTax,
    taxPaidSoFar: roundAmount(cumulativePaid),
    remainingTaxDue: Math.max(0, roundAmount(totalTax - cumulativePaid)),
    installments,
    disclaimer: "Advance tax is calculated per Indian Income Tax Act guidelines. Consult a qualified CA for official tax filings.",
  };
};

module.exports = {
  computeNewRegimeTax,
  computeOldRegimeTax,
  compute44ADATax,
  compareAllRegimes,
  calculateRecommendedTaxReserve,
  calculateGSTStatus,
  computeAdvanceTaxSchedule,
};
