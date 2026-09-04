const mongoose = require("mongoose");

const aiMessageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "AIConversation", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["user", "assistant", "system", "tool"], required: true },
    content: { type: String, required: true },
    toolCalls: [
      {
        id: String,
        name: String,
        args: mongoose.Schema.Types.Mixed,
        result: mongoose.Schema.Types.Mixed,
      },
    ],
    evidence: {
      facts: [String],
      forecasts: [String],
      recommendations: [String],
      uncertainties: [String],
      metrics: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

aiMessageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model("AIMessage", aiMessageSchema);
