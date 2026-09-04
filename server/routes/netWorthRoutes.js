const express = require("express");
const router = express.Router();
const {
  getNetWorthOverview,
  createAsset,
  deleteAsset,
  createLiability,
  deleteLiability,
} = require("../controllers/netWorthController");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const { assetSchema, liabilitySchema } = require("../validations/financialSchemas");

router.get("/", protect, getNetWorthOverview);
router.post("/assets", protect, validate(assetSchema), createAsset);
router.delete("/assets/:id", protect, deleteAsset);
router.post("/liabilities", protect, validate(liabilitySchema), createLiability);
router.delete("/liabilities/:id", protect, deleteLiability);

module.exports = router;
