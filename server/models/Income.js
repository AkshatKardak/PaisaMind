const mongoose = require("mongoose");

const incomeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    source: { type: String, required: true },
    category: { type: String, default: "Other" },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

incomeSchema.index({ userId: 1, date: -1 });
incomeSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model("Income", incomeSchema);