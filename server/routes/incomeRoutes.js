const express = require("express");
const {
  getIncome,
  addIncome,
  updateIncome,
  deleteIncome,
  getIncomeSummary,
  getGSTStatus,
} = require("../controllers/incomeController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/summary",    getIncomeSummary);
router.get("/gst-status", getGSTStatus);       // NEW: GST threshold widget
router.route("/").get(getIncome).post(addIncome);
router.route("/:id").put(updateIncome).delete(deleteIncome);

module.exports = router;
