const express = require("express");
const router = express.Router();
const { parseEntryController } = require("../controllers/entryController");

// POST /api/entries/parse
router.post("/parse", parseEntryController);

module.exports = router;
