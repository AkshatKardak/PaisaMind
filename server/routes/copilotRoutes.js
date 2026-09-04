const express = require("express");
const router = express.Router();
const {
  chatWithCopilot,
  getConversationHistory,
  listConversations,
} = require("../controllers/copilotController");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const { copilotChatSchema } = require("../validations/financialSchemas");

router.post("/chat", protect, validate(copilotChatSchema), chatWithCopilot);
router.get("/conversations", protect, listConversations);
router.get("/conversations/:conversationId", protect, getConversationHistory);

module.exports = router;
