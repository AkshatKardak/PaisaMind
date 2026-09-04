const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  uploadAndParseStatement,
  remapColumns,
  commitStatementTransactions,
  getStatementImport,
} = require("../controllers/statementController");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const { statementCommitSchema } = require("../validations/financialSchemas");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.split(".").pop().toLowerCase();
    if (["csv", "xlsx", "xls", "pdf", "png", "jpg", "jpeg"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV, Excel (.xlsx/.xls), PDF, or passbook photos (PNG/JPG) are allowed."));
    }
  },
});

router.post("/upload", protect, upload.single("statement"), uploadAndParseStatement);
router.post("/remap", protect, remapColumns);
router.post("/commit", protect, validate(statementCommitSchema), commitStatementTransactions);
router.get("/:id", protect, getStatementImport);

module.exports = router;
