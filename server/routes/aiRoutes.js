const express = require("express");

const { getInsights, getMonthlyReport, getInvoiceReminder } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.post("/insights", getInsights);
router.post("/monthly-report", getMonthlyReport);
router.post("/invoice-reminder", getInvoiceReminder);

module.exports = router;
