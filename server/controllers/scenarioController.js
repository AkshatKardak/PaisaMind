const asyncHandler = require("express-async-handler");
const { simulateScenario } = require("../services/simulationService");
const { logAuditEvent } = require("../services/auditService");

const simulateFinancialScenario = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const result = await simulateScenario(userId, req.body);

  await logAuditEvent({
    userId,
    action: "SCENARIO_SIMULATED",
    resource: "ScenarioSimulator",
    details: { type: req.body.scenarioType, amount: req.body.amount },
    req,
  });

  return res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = {
  simulateFinancialScenario,
};
