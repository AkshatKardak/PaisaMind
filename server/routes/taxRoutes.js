const express = require("express");

const { getGSTStatus, compareRegime, getAdvanceTax } = require("../controllers/taxController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/gst-status", getGSTStatus);
router.post("/compare-regime", compareRegime);
router.get("/advance-tax", getAdvanceTax);

module.exports = router;
