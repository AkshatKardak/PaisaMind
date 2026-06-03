const express = require("express");
const router  = express.Router();
const {
  getMonthlyReport,
  getAIInsights,
  getHealthScoreExplanation,
  getTaxSavingSuggestions,
  getCashFlowForecast,
} = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

// Monthly report — dedicated handler (accepts month + year in body or query)
router.post("/monthly-report",    protect, getMonthlyReport);
router.get("/monthly-report",     protect, getMonthlyReport);

// Dashboard insights
router.post("/insights",          protect, getAIInsights);

// Health score
router.get("/health-score",        protect, getHealthScoreExplanation);

// Tax
router.get("/tax-suggestions",     protect, getTaxSavingSuggestions);
router.get("/tax-saving",          protect, getTaxSavingSuggestions);

// Cash flow
router.get("/cashflow-forecast",   protect, getCashFlowForecast);
router.get("/cash-flow-forecast",  protect, getCashFlowForecast);

// Legacy invoice-reminder alias (kept for backwards compat)
router.post("/invoice-reminder",   protect, getAIInsights);

module.exports = router;
