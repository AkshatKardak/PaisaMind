const express = require("express");
const router = express.Router();
const {
  getAIInsights,
  getHealthScoreExplanation,
  getTaxSavingSuggestions,
  getCashFlowForecast,
} = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

router.post("/insights",          protect, getAIInsights);
router.get("/health-score",        protect, getHealthScoreExplanation);

// canonical name
router.get("/tax-suggestions",     protect, getTaxSavingSuggestions);
// alias used by client aiService.js → GET /ai/tax-saving
router.get("/tax-saving",          protect, getTaxSavingSuggestions);

// canonical name
router.get("/cashflow-forecast",   protect, getCashFlowForecast);
// alias used by client aiService.js → GET /ai/cash-flow-forecast
router.get("/cash-flow-forecast",  protect, getCashFlowForecast);

router.post("/monthly-report",     protect, require("../controllers/aiController").getAIInsights);
router.post("/invoice-reminder",   protect, require("../controllers/aiController").getAIInsights);

module.exports = router;
