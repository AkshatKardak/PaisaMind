const mongoose = require("mongoose");

const anomalySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["spending_spike", "unusual_vendor", "duplicate_candidate", "recurring_price_hike", "high_burn_rate"],
      required: true,
    },
    category: { type: String, default: "Other" },
    amount: { type: Number, required: true },
    baselineAmount: { type: Number, default: 0 },
    percentageDeviation: { type: Number, default: 0 },
    zScore: { type: Number, default: 0 },
    description: { type: String, required: true },
    relatedTransactionId: { type: mongoose.Schema.Types.ObjectId, refPath: "transactionModel" },
    transactionModel: { type: String, enum: ["Expense", "Income"] },
    candidateDuplicateId: { type: mongoose.Schema.Types.ObjectId, ref: "Expense" },
    status: {
      type: String,
      enum: ["active", "acknowledged", "resolved", "dismissed"],
      default: "active",
    },
    detectionDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

anomalySchema.index({ userId: 1, status: 1, detectionDate: -1 });

module.exports = mongoose.model("Anomaly", anomalySchema);
