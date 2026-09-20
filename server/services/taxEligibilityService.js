const { getActiveRules } = require("./taxRuleResolver");

/**
 * Validates legal eligibility for Section 44ADA Presumptive Taxation Scheme
 *
 * Requirements per Section 44ADA of the Income Tax Act, 1961:
 * 1. Taxpayer Entity Type: Resident Individual, HUF, or Partnership Firm.
 *    Strictly EXCLUDES Limited Liability Partnerships (LLP) and Companies.
 * 2. Specified Profession: Legal, Medical, Engineering, Architectural, Accountancy,
 *    Technical Consultancy, Interior Decoration, Authorized Representative, Film Artist,
 *    Company Secretary, Information Technology / Software Consulting.
 * 3. Turnover Limit:
 *    - Up to ₹75 Lakhs if cash receipts <= 5% of gross receipts.
 *    - Up to ₹50 Lakhs if cash receipts > 5%.
 */
const evaluate44ADAEligibility = async ({
  grossReceipts,
  cashReceipts = 0,
  taxpayerType,
  profession,
  financialYear = "2025-26",
} = {}) => {
  const rules = await getActiveRules(financialYear);
  const config = rules.presumptive?.section44ADA;

  if (!config) {
    throw new Error(`Section 44ADA configuration not found for FY ${financialYear}`);
  }

  // 0. Validate required fields for statutory determination
  const missingFields = [];
  if (grossReceipts === undefined || grossReceipts === null || isNaN(Number(grossReceipts))) {
    missingFields.push("grossReceipts (annual gross professional turnover)");
  }
  if (!taxpayerType || typeof taxpayerType !== "string" || !taxpayerType.trim()) {
    missingFields.push("taxpayerType (e.g. INDIVIDUAL, HUF, PARTNERSHIP_FIRM, LLP, COMPANY)");
  }
  if (!profession || typeof profession !== "string" || !profession.trim()) {
    missingFields.push("profession (e.g. INFORMATION_TECHNOLOGY, TECHNICAL_CONSULTANCY, LEGAL, etc.)");
  }

  if (missingFields.length > 0) {
    return {
      status: "INSUFFICIENT_INFORMATION",
      isEligible: false,
      missingFields,
      taxpayerType: taxpayerType || null,
      profession: profession || null,
      grossReceipts: grossReceipts !== undefined && grossReceipts !== null ? Number(grossReceipts) : null,
      cashReceipts: Number(cashReceipts || 0),
      cashPercentage: 0,
      cashThresholdPercentage: config.cashReceiptThresholdPercentage,
      applicableGrossLimit: config.standardGrossLimit,
      presumptiveProfitRate: config.presumptiveProfitRate,
      deemedProfit: 0,
      reasons: [
        `Cannot determine Section 44ADA statutory eligibility due to missing or indeterminate inputs: ${missingFields.join(", ")}. Please provide all required taxpayer attributes.`,
      ],
      ruleVersion: rules.version,
      sourceNotification: rules.sourceNotification,
    };
  }

  const gross = Math.max(0, Number(grossReceipts || 0));
  const cash = Math.max(0, Number(cashReceipts || 0));
  const normalizedEntity = String(taxpayerType).toUpperCase().trim();
  const normalizedProfession = String(profession).toUpperCase().trim();

  const reasons = [];
  let isEligible = true;

  // 1. Entity Type Validation
  if (config.ineligibleEntities?.includes(normalizedEntity)) {
    isEligible = false;
    reasons.push(
      `Entity type '${normalizedEntity}' is ineligible for Section 44ADA. Under Section 44ADA(1), Limited Liability Partnerships (LLPs) and Companies cannot opt for presumptive taxation.`
    );
  } else if (!config.eligibleEntities?.includes(normalizedEntity)) {
    isEligible = false;
    reasons.push(`Taxpayer entity '${normalizedEntity}' is not in the list of eligible resident entities.`);
  }

  // 2. Profession Validation
  if (normalizedProfession && config.specifiedProfessions && config.specifiedProfessions.length > 0) {
    const matchesProfession = config.specifiedProfessions.some(
      (sp) => normalizedProfession.includes(sp) || sp.includes(normalizedProfession)
    );
    if (!matchesProfession && normalizedProfession !== "FREELANCER" && normalizedProfession !== "OTHER_PROFESSIONAL") {
      reasons.push(
        `Profession '${normalizedProfession}' may not qualify under Section 44AA(1) specified professions unless recognized as technical consultancy.`
      );
    }
  }

  // 3. Cash Receipts & Enhanced Threshold Validation
  const cashPercentage = gross > 0 ? (cash / gross) * 100 : 0;
  const isCashWithinLimit = cashPercentage <= config.cashReceiptThresholdPercentage;
  const applicableGrossLimit = isCashWithinLimit ? config.enhancedGrossLimit : config.standardGrossLimit;

  if (gross > applicableGrossLimit) {
    isEligible = false;
    reasons.push(
      `Gross receipts (₹${gross.toLocaleString("en-IN")}) exceed the applicable statutory limit of ₹${applicableGrossLimit.toLocaleString("en-IN")}${
        !isCashWithinLimit ? ` (standard limit ₹50L applies because cash receipts exceed ${config.cashReceiptThresholdPercentage}%)` : ""
      }.`
    );
  }

  // 4. Deemed Profit Calculation (minimum 50%)
  const deemedProfit = Math.round(gross * config.presumptiveProfitRate);

  return {
    status: isEligible ? "ELIGIBLE" : "INELIGIBLE",
    isEligible,
    taxpayerType: normalizedEntity,
    profession: normalizedProfession,
    grossReceipts: gross,
    cashReceipts: cash,
    cashPercentage: Number(cashPercentage.toFixed(2)),
    cashThresholdPercentage: config.cashReceiptThresholdPercentage,
    applicableGrossLimit,
    presumptiveProfitRate: config.presumptiveProfitRate,
    deemedProfit,
    reasons: reasons.length > 0 ? reasons : ["Eligible for Section 44ADA presumptive taxation scheme."],
    ruleVersion: rules.version,
    sourceNotification: rules.sourceNotification,
  };
};

module.exports = {
  evaluate44ADAEligibility,
};
