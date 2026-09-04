const express = require("express");
const router = express.Router();
const { simulateFinancialScenario } = require("../controllers/scenarioController");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const { scenarioSimulateSchema } = require("../validations/financialSchemas");

router.post("/simulate", protect, validate(scenarioSimulateSchema), simulateFinancialScenario);
router.post("/", protect, validate(scenarioSimulateSchema), simulateFinancialScenario);

module.exports = router;
