/**
 * Centralized Indian Tax Rules & Configuration
 * Applicable for Financial Year 2025-26 (Assessment Year 2026-27)
 */

const TAX_CONFIG = {
  financialYear: "2025-26",
  assessmentYear: "2026-27",

  // New Tax Regime Slabs (Default regime under Section 115BAC)
  newRegime: {
    standardDeduction: 75000,
    rebate87ALimit: 700000, // No tax if taxable income <= 7,00,000
    slabs: [
      { limit: 300000, rate: 0.0 },
      { limit: 700000, rate: 0.05 },
      { limit: 1000000, rate: 0.10 },
      { limit: 1200000, rate: 0.15 },
      { limit: 1500000, rate: 0.20 },
      { limit: Infinity, rate: 0.30 },
    ],
  },

  // Old Tax Regime Slabs
  oldRegime: {
    standardDeduction: 50000,
    rebate87ALimit: 500000,
    max80C: 150000,
    max80D_self: 25000,
    max80D_parents: 50000,
    max80CCD1B: 50000, // NPS
    slabs: [
      { limit: 250000, rate: 0.0 },
      { limit: 500000, rate: 0.05 },
      { limit: 1000000, rate: 0.20 },
      { limit: Infinity, rate: 0.30 },
    ],
  },

  // Section 44ADA Presumptive Taxation Scheme for Freelancers / Specified Professionals
  section44ADA: {
    grossReceiptsLimit: 7500000, // Up to 75 Lakhs (with <= 5% cash receipts)
    presumptiveIncomeRate: 0.50, // 50% of gross receipts deemed as taxable profits
    description: "Presumptive taxation for freelancers & professionals under Section 44ADA (50% profit margin).",
  },

  // Health and Education Cess
  cessRate: 0.04, // 4%

  // GST Compliance Thresholds
  gst: {
    servicesThreshold: 2000000, // 20 Lakhs (Annual turnover for services)
    goodsThreshold: 4000000,    // 40 Lakhs
    specialStatesThreshold: 1000000, // 10 Lakhs
    warningThreshold: 1800000,  // 18 Lakhs alert
    dangerThreshold: 1950000,   // 19.5 Lakhs critical alert
  },

  // TDS Rates
  tds: {
    section194J_technical: 0.02, // 2% for FTS/Call center
    section194J_professional: 0.10, // 10% for professional fees
    section194C_individual: 0.01, // 1% for contractor payments (indiv/HUF)
    section194C_company: 0.02, // 2% for contractor payments (others)
  },

  // Advance Tax Installment Schedule
  advanceTaxSchedule: [
    { quarter: "Q1", dueMonth: 5, dueDay: 15, label: "15th June", cumulativePercentage: 15 },
    { quarter: "Q2", dueMonth: 8, dueDay: 15, label: "15th September", cumulativePercentage: 45 },
    { quarter: "Q3", dueMonth: 11, dueDay: 15, label: "15th December", cumulativePercentage: 75 },
    { quarter: "Q4", dueMonth: 2, dueDay: 15, nextYear: true, label: "15th March", cumulativePercentage: 100 },
  ],
};

module.exports = TAX_CONFIG;
