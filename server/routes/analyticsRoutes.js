const express = require("express");
const router = express.Router();
const {
  getFinancialSummary,
  getFinancialHealth,
  getAnomalies,
  getDuplicates,
  getRecurringIntelligence,
  getIncomeVolatility,
  getInvoiceRisk,
  getCashRunway,
  getCashflowForecast,
  resolveDuplicate,
} = require("../controllers/analyticsController");
const { protect } = require("../middleware/authMiddleware");

router.get("/financial-summary", protect, getFinancialSummary);
router.get("/financial-health", protect, getFinancialHealth);
router.get("/anomalies", protect, getAnomalies);
router.get("/duplicates", protect, getDuplicates);
router.get("/recurring", protect, getRecurringIntelligence);
router.get("/volatility", protect, getIncomeVolatility);
router.get("/invoice-risk", protect, getInvoiceRisk);
router.get("/runway", protect, getCashRunway);
router.get("/cashflow-forecast", protect, getCashflowForecast);
router.post("/duplicates/resolve", protect, resolveDuplicate);

module.exports = router;
