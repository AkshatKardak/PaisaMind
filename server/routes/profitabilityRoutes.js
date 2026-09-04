const express = require("express");
const router = express.Router();
const {
  getProfitabilityOverview,
  createProject,
  logProjectHours,
  logProjectExpense,
  deleteProject,
} = require("../controllers/profitabilityController");
const { protect } = require("../middleware/authMiddleware");

router.get("/overview", protect, getProfitabilityOverview);
router.post("/projects", protect, createProject);
router.post("/projects/:id/log-hours", protect, logProjectHours);
router.post("/projects/:id/log-expense", protect, logProjectExpense);
router.delete("/projects/:id", protect, deleteProject);

module.exports = router;
