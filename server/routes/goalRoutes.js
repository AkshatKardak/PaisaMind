const express = require("express");

const {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  updateProgress,
} = require("../controllers/goalController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.patch("/:id/progress", updateProgress);
router.route("/").get(getGoals).post(createGoal);
router.route("/:id").put(updateGoal).delete(deleteGoal);

module.exports = router;
