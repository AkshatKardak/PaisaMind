const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  getReconciliationReport,
  importTdsRecords,
  getTdsRecords,
  manualReconcile,
  upload26as,
  get3BucketReconciliation,
  deleteTdsRecords,
} = require("../controllers/tdsController");
const { protect } = require("../middleware/authMiddleware");

// 10MB memory upload for PDF
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

// All routes are strictly protected by user session
router.use(protect);

router.get("/reconcile", getReconciliationReport);
router.get("/records", getTdsRecords);
router.get("/buckets", get3BucketReconciliation);
router.post("/import", importTdsRecords);
router.post("/upload", upload.single("file"), upload26as);
router.post("/manual-link", manualReconcile);
router.delete("/records", deleteTdsRecords);

module.exports = router;
