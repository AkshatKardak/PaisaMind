const express = require("express");
const router = express.Router();
const {
  getAIInsights,
  getHealthScoreExplanation,
  getTaxSavingSuggestions,
  getCashFlowForecast,
} = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

router.get("/insights", protect, getAIInsights);
router.get("/health-score", protect, getHealthScoreExplanation);
router.get("/tax-suggestions", protect, getTaxSavingSuggestions);
router.get("/cashflow-forecast", protect, getCashFlowForecast);

module.exports = router;