const { getActiveRules, getFinancialYearFromDate } = require("./taxRuleResolver");
const { evaluate44ADAEligibility } = require("./taxEligibilityService");

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
    const slabSpan = slab.limit === Infinity || slab.limit === null ? remaining : slab.limit - previousLimit;
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
const computeNewRegimeTax = async (grossIncome = 0, isSalaried = false, financialYear = "2025-26") => {
  const rules = await getActiveRules(financialYear);
  const gross = Math.max(0, Number(grossIncome));
  const stdDeduction = isSalaried ? rules.newRegime.standardDeduction : 0;
  const taxableIncome = Math.max(0, gross - stdDeduction);

  let basicTax = calculateSlabTax(taxableIncome, rules.newRegime.slabs);

  // Section 87A Rebate: if taxable income <= rebate limit, tax liability is 0
  if (taxableIncome <= rules.newRegime.rebate87ALimit) {
    basicTax = 0;
  }

  const cess = basicTax * rules.cessRate;
  const totalTax = roundAmount(basicTax + cess);
  const effectiveRate = gross > 0 ? Number(((totalTax / gross) * 100).toFixed(2)) : 0;

  return {
    regime: "new",
    ruleVersion: rules.version,
    financialYear: rules.financialYear,
    sourceNotification: rules.sourceNotification,
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
const computeOldRegimeTax = async (grossIncome = 0, deductions = {}, financialYear = "2025-26") => {
  const rules = await getActiveRules(financialYear);
  const gross = Math.max(0, Number(grossIncome));
  const d80C = Math.min(Number(deductions.section80C || 0), rules.oldRegime.max80C);
  const d80D = Math.min(
    Number(deductions.section80D || 0),
    rules.oldRegime.max80D_self + rules.oldRegime.max80D_parents
  );
  const dNPS = Math.min(Number(deductions.section80CCD1B || 0), rules.oldRegime.max80CCD1B);
  const hra = Number(deductions.hra || 0);
  const isSalaried = Boolean(deductions.isSalaried);
  const stdDeduction = isSalaried ? rules.oldRegime.standardDeduction : 0;

  const totalDeductions = d80C + d80D + dNPS + hra + stdDeduction;
  const taxableIncome = Math.max(0, gross - totalDeductions);

  let basicTax = calculateSlabTax(taxableIncome, rules.oldRegime.slabs);

  // Section 87A Rebate in Old Regime (taxable income <= 5,00,000)
  if (taxableIncome <= rules.oldRegime.rebate87ALimit) {
    basicTax = 0;
  }

  const cess = basicTax * rules.cessRate;
  const totalTax = roundAmount(basicTax + cess);
  const effectiveRate = gross > 0 ? Number(((totalTax / gross) * 100).toFixed(2)) : 0;

  return {
    regime: "old",
    ruleVersion: rules.version,
    financialYear: rules.financialYear,
    sourceNotification: rules.sourceNotification,
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
 */
const compute44ADATax = async (grossReceipts = 0, isNewRegime = true, deductions = {}, options = {}) => {
  const fy = options.financialYear || "2025-26";
  const rules = await getActiveRules(fy);
  const gross = Math.max(0, Number(grossReceipts));

  const eligibility = await evaluate44ADAEligibility({
    grossReceipts: gross,
    cashReceipts: options.cashReceipts || 0,
    taxpayerType: options.taxpayerType || "INDIVIDUAL",
    profession: options.profession || "INFORMATION_TECHNOLOGY",
    financialYear: fy,
  });

  let taxResult;
  if (isNewRegime) {
    taxResult = await computeNewRegimeTax(eligibility.deemedProfit, false, fy);
  } else {
    taxResult = await computeOldRegimeTax(eligibility.deemedProfit, deductions, fy);
  }

  return {
    isEligible: eligibility.isEligible,
    eligibilityReasons: eligibility.reasons,
    applicableGrossLimit: eligibility.applicableGrossLimit,
    grossReceipts: roundAmount(gross),
    deemedProfit: eligibility.deemedProfit,
    presumptiveRate: `${Math.round(rules.presumptive.section44ADA.presumptiveProfitRate * 100)}%`,
    ruleVersion: rules.version,
    sourceNotification: rules.sourceNotification,
    ...taxResult,
    taxSavingsVsNormal: 0,
  };
};

/**
 * Compares Old Regime vs New Regime vs 44ADA for a user
 */
const compareAllRegimes = async (grossIncome = 0, eligibleExpenses = 0, deductions = {}, options = {}) => {
  const fy = options.financialYear || "2025-26";
  const rules = await getActiveRules(fy);
  const gross = Number(grossIncome);
  const normalNetIncome = Math.max(0, gross - Number(eligibleExpenses || 0));

  const [normalNew, normalOld, presumptiveNew, presumptiveOld] = await Promise.all([
    computeNewRegimeTax(normalNetIncome, false, fy),
    computeOldRegimeTax(normalNetIncome, deductions, fy),
    compute44ADATax(gross, true, deductions, options),
    compute44ADATax(gross, false, deductions, options),
  ]);

  const optionsList = [
    { name: "New Regime (Actual Expenses)", tax: normalNew.totalTax, taxableIncome: normalNew.taxableIncome, tag: "new_actual" },
    { name: "Old Regime (Actual Expenses + Deductions)", tax: normalOld.totalTax, taxableIncome: normalOld.taxableIncome, tag: "old_actual" },
  ];

  if (presumptiveNew.isEligible) {
    optionsList.push({ name: "Section 44ADA (New Regime)", tax: presumptiveNew.totalTax, taxableIncome: presumptiveNew.taxableIncome, tag: "44ada_new" });
    optionsList.push({ name: "Section 44ADA (Old Regime)", tax: presumptiveOld.totalTax, taxableIncome: presumptiveOld.taxableIncome, tag: "44ada_old" });
  }

  optionsList.sort((a, b) => a.tax - b.tax);
  const best = optionsList[0];

  return {
    grossIncome: roundAmount(gross),
    eligibleExpenses: roundAmount(eligibleExpenses),
    ruleVersion: rules.version,
    financialYear: rules.financialYear,
    sourceNotification: rules.sourceNotification,
    normalNew,
    normalOld,
    presumptiveNew,
    presumptiveOld,
    recommendedOption: best,
    annualTaxSavings: roundAmount(Math.max(...optionsList.map((o) => o.tax)) - best.tax),
  };
};

/**
 * Recommends an exact Tax Reserve percentage and amount for an incoming payment
 */
const calculateRecommendedTaxReserve = async ({
  annualProjectedIncome = 0,
  ytdIncome = 0,
  newIncomeAmount = 0,
  regime = "new",
  use44ADA = true,
  deductions = {},
  financialYear = "2025-26",
}) => {
  const rules = await getActiveRules(financialYear);
  const currentTotal = Number(ytdIncome);
  const nextTotal = currentTotal + Number(newIncomeAmount);

  let taxBefore = 0;
  let taxAfter = 0;

  if (use44ADA && nextTotal <= rules.presumptive.section44ADA.enhancedGrossLimit) {
    const resBefore = await compute44ADATax(currentTotal, regime === "new", deductions, { financialYear });
    const resAfter = await compute44ADATax(nextTotal, regime === "new", deductions, { financialYear });
    taxBefore = resBefore.totalTax;
    taxAfter = resAfter.totalTax;
  } else {
    const resBefore = regime === "new"
      ? await computeNewRegimeTax(currentTotal, false, financialYear)
      : await computeOldRegimeTax(currentTotal, deductions, financialYear);
    const resAfter = regime === "new"
      ? await computeNewRegimeTax(nextTotal, false, financialYear)
      : await computeOldRegimeTax(nextTotal, deductions, financialYear);
    taxBefore = resBefore.totalTax;
    taxAfter = resAfter.totalTax;
  }

  const marginalTax = Math.max(0, taxAfter - taxBefore);
  const marginalRate = newIncomeAmount > 0 ? (marginalTax / newIncomeAmount) : 0;
  const safeReserveRate = Math.max(marginalRate, nextTotal > rules.newRegime.rebate87ALimit ? 0.15 : 0.0);
  const recommendedReserve = roundAmount(newIncomeAmount * safeReserveRate);

  return {
    incomeEventAmount: roundAmount(newIncomeAmount),
    ytdIncomeAfter: roundAmount(nextTotal),
    marginalTax: roundAmount(marginalTax),
    recommendedReserveAmount: recommendedReserve,
    reservePercentage: Math.round(safeReserveRate * 100),
    totalAnnualTaxProjected: roundAmount(taxAfter),
    ruleVersion: rules.version,
    explanation: `Based on ₹${roundAmount(nextTotal).toLocaleString("en-IN")} YTD income under ${regime.toUpperCase()} regime (${use44ADA ? "Sec 44ADA" : "Regular"}), reserve ~${Math.round(safeReserveRate * 100)}% (₹${recommendedReserve.toLocaleString("en-IN")}) for taxes.`,
  };
};

/**
 * Calculates GST threshold tracking & liability
 */
const calculateGSTStatus = async (annualTurnover = 0, registered = false, financialYear = "2025-26") => {
  const rules = await getActiveRules(financialYear);
  const turnover = Number(annualTurnover || 0);
  const threshold = rules.gst.servicesThreshold;
  const progressPercent = Math.min(100, Number(((turnover / threshold) * 100).toFixed(1)));

  let status = "safe";
  let alertMessage = `Turnover is ₹${turnover.toLocaleString("en-IN")} (${progressPercent}% of ₹20L threshold).`;

  if (turnover >= threshold) {
    status = "mandatory_registration";
    alertMessage = "You have crossed the ₹20 Lakh turnover threshold! GST registration is mandatory for service providers.";
  } else if (turnover >= rules.gst.dangerThreshold) {
    status = "danger";
    alertMessage = `CRITICAL: You are at ₹${turnover.toLocaleString("en-IN")}, only ₹${(threshold - turnover).toLocaleString("en-IN")} away from mandatory GST registration!`;
  } else if (turnover >= rules.gst.warningThreshold) {
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
    ruleVersion: rules.version,
  };
};

/**
 * Calculates Indian Advance Tax schedule for the current financial year
 */
const computeAdvanceTaxSchedule = async (annualEstimatedTax = 0, taxPaidSoFar = 0, financialYear = "2025-26") => {
  const rules = await getActiveRules(financialYear);
  const totalTax = Math.max(0, Number(annualEstimatedTax));
  const isLiable = totalTax > rules.advanceTax.section208LiabilityThreshold;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;

  let cumulativePaid = Number(taxPaidSoFar || 0);

  const installments = rules.advanceTax.schedule.map((item) => {
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
    ruleVersion: rules.version,
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
