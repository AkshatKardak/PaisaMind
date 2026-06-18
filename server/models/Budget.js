const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: true },
    limit:    { type: Number, required: true },
    month:    { type: Number, required: true }, // 1-12
    year:     { type: Number, required: true },
  },
  { timestamps: true }
);

// One budget per category per month per user
budgetSchema.index({ userId: 1, category: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);
