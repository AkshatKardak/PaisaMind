/**
 * Centralized Indian Tax Rules & Configuration Adapter
 * 
 * NOTE: All statutory tax rates, slabs, rebates, cess, 44ADA limits, GST thresholds,
 * TDS rates, and advance tax schedules are dynamically resolved from versioned
 * statutory rule datasets via taxRuleResolver.
 * 
 * Hardcoded statutory values have been removed to prevent drift and rule conflicts.
 */
const {
  getActiveRules,
  getRulesForDate,
  getFinancialYearFromDate,
} = require("./taxRuleResolver");

module.exports = {
  getActiveRules,
  getRulesForDate,
  getFinancialYearFromDate,
};
