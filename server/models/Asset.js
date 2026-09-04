const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "cash",
        "bank_account",
        "receivable",
        "investment",
        "fixed_deposit",
        "mutual_fund",
        "stocks",
        "real_estate",
        "crypto",
        "other",
      ],
      default: "bank_account",
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    institution: { type: String, default: "" },
    isLiquid: { type: Boolean, default: true },
    notes: { type: String, default: "" },
    lastValuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

assetSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model("Asset", assetSchema);
