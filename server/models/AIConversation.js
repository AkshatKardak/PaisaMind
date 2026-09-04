const mongoose = require("mongoose");

const aiConversationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "Financial Consultation" },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

aiConversationSchema.index({ userId: 1, lastMessageAt: -1 });

module.exports = mongoose.model("AIConversation", aiConversationSchema);
