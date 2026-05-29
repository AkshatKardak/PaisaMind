const express = require("express");
const router = express.Router();
const {
  getTaxOverview,
  compareTaxRegimes,
  getGSTProgress,
  getAdvanceTax,
} = require("../controllers/taxController");
const { protect } = require("../middleware/authMiddleware");

router.get("/overview",      protect, getTaxOverview);
router.post("/compare",      protect, compareTaxRegimes);

// canonical name
router.get("/gst-progress",  protect, getGSTProgress);
// alias used by client → GET /tax/gst-status
router.get("/gst-status",    protect, getGSTProgress);

// new endpoint used by client → GET /tax/advance-tax
router.get("/advance-tax",   protect, getAdvanceTax);

module.exports = router;
