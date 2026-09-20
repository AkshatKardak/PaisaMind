const express = require("express");
const router = express.Router();
const {
  getReconciliationReport,
  importTdsRecords,
  getTdsRecords,
  manualReconcile,
} = require("../controllers/tdsController");
const { protect } = require("../middleware/authMiddleware");

// All routes are strictly protected by user session
router.use(protect);

router.get("/reconcile", getReconciliationReport);
router.get("/records", getTdsRecords);
router.post("/import", importTdsRecords);
router.post("/manual-link", manualReconcile);

module.exports = router;
