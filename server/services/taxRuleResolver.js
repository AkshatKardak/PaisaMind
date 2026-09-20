const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

let TaxRuleVersion;
try {
  TaxRuleVersion = require("../models/TaxRuleVersion");
} catch (e) {}

// In-memory cache for resolved tax rules
const ruleCache = new Map();

/**
 * Loads fallback rule dataset from bundled JSON
 */
const loadJsonFallback = (fy) => {
  const normalizedFy = (fy || "2025-26").replace(/[^0-9\-]/g, "").replace("-", "_");
  const fileName = `fy${normalizedFy}.json`;
  const filePath = path.join(__dirname, "..", "data", "tax_rules", fileName);

  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`[TaxRuleResolver] Failed to parse ${filePath}:`, e.message);
    }
  }

  // Ultimate fallback to 2025-26 if specific FY file not found
  const fallbackPath = path.join(__dirname, "..", "data", "tax_rules", "fy2025_26.json");
  if (fs.existsSync(fallbackPath)) {
    const raw = fs.readFileSync(fallbackPath, "utf-8");
    return JSON.parse(raw);
  }

  throw new Error(`[TaxRuleResolver] No tax rule definitions found for FY ${fy}`);
};

/**
 * Derives Indian Financial Year string from a Date object
 * e.g. 15 Aug 2025 -> "2025-26", 15 Feb 2026 -> "2025-26", 15 May 2026 -> "2026-27"
 */
const getFinancialYearFromDate = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed (0 = Jan, 2 = March, 3 = April)
  const fyStart = month >= 3 ? year : year - 1;
  const fyEnd = (fyStart + 1).toString().slice(-2);
  return `${fyStart}-${fyEnd}`;
};

/**
 * Resolves tax rules for a specific financial year
 */
const getActiveRules = async (financialYear = "2025-26") => {
  const fy = String(financialYear || "2025-26").trim();

  if (ruleCache.has(fy)) {
    return ruleCache.get(fy);
  }

  // 1. Try fetching from MongoDB if connected
  if (TaxRuleVersion && mongoose.connection.readyState === 1) {
    try {
      const dbRule = await TaxRuleVersion.findOne({
        financialYear: fy,
        status: { $in: ["ACTIVE", "DRAFT"] },
      }).lean();

      if (dbRule) {
        // Map slabs where limit is null back to Infinity for calculation arithmetic
        const sanitized = sanitizeRuleObject(dbRule);
        ruleCache.set(fy, sanitized);
        return sanitized;
      }
    } catch (err) {
      console.warn(`[TaxRuleResolver] DB lookup failed for FY ${fy}, using JSON fallback:`, err.message);
    }
  }

  // 2. Fall back to bundled JSON
  const jsonRule = loadJsonFallback(fy);
  const sanitized = sanitizeRuleObject(jsonRule);
  ruleCache.set(fy, sanitized);
  return sanitized;
};

/**
 * Resolves tax rules applicable to a specific calendar date
 */
const getRulesForDate = async (date = new Date()) => {
  const fy = getFinancialYearFromDate(date);
  return getActiveRules(fy);
};

/**
 * Normalizes rule object: replaces null slab limits with Infinity for calculations
 */
const sanitizeRuleObject = (rule) => {
  const clone = JSON.parse(JSON.stringify(rule));

  if (clone.newRegime?.slabs) {
    clone.newRegime.slabs = clone.newRegime.slabs.map((s) => ({
      ...s,
      limit: s.limit === null ? Infinity : s.limit,
    }));
  }

  if (clone.oldRegime?.slabs) {
    clone.oldRegime.slabs = clone.oldRegime.slabs.map((s) => ({
      ...s,
      limit: s.limit === null ? Infinity : s.limit,
    }));
  }

  return clone;
};

/**
 * Clears rule cache (useful in tests or when new rules are seeded)
 */
const clearRuleCache = () => {
  ruleCache.clear();
};

module.exports = {
  getActiveRules,
  getRulesForDate,
  getFinancialYearFromDate,
  clearRuleCache,
};
