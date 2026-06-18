const express = require("express");
const { getBudgets, upsertBudget, deleteBudget } = require("../controllers/budgetController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect);
router.get("/",       getBudgets);
router.post("/",      upsertBudget);
router.delete("/:id", deleteBudget);

module.exports = router;
