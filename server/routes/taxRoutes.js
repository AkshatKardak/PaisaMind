const express = require("express");
const router = express.Router();
const {
  getTaxOverview,
  compareTaxRegimes,
  getGSTProgress,
  getAdvanceTax,
  getTaxReserveEstimate,
} = require("../controllers/taxController");
const { protect } = require("../middleware/authMiddleware");

router.get("/overview",      protect, getTaxOverview);
router.post("/compare",      protect, compareTaxRegimes);
router.get("/gst-progress",  protect, getGSTProgress);
router.get("/gst-status",    protect, getGSTProgress);
router.get("/advance-tax",   protect, getAdvanceTax);
router.get("/reserve",       protect, getTaxReserveEstimate);

module.exports = router;
