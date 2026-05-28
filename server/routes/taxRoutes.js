const express = require("express");
const router = express.Router();
const {
  getTaxOverview,
  compareTaxRegimes,
  getGSTProgress,
} = require("../controllers/taxController");
const { protect } = require("../middleware/authMiddleware");

router.get("/overview", protect, getTaxOverview);
router.post("/compare", protect, compareTaxRegimes);
router.get("/gst-progress", protect, getGSTProgress);

module.exports = router;