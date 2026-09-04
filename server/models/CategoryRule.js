const mongoose = require("mongoose");

const categoryRuleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    pattern: { type: String, required: true, lowercase: true, trim: true },
    matchType: {
      type: String,
      enum: ["exact", "contains", "regex"],
      default: "contains",
    },
    category: { type: String, required: true },
    transactionType: { type: String, enum: ["income", "expense", "any"], default: "any" },
    source: { type: String, enum: ["user_correction", "system_rule"], default: "user_correction" },
    usageCount: { type: Number, default: 1 },
  },
  { timestamps: true }
);

categoryRuleSchema.index({ userId: 1, pattern: 1 }, { unique: true });

module.exports = mongoose.model("CategoryRule", categoryRuleSchema);
