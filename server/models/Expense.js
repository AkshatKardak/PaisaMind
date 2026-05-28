const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    notes: { type: String, default: "" },
    recurring: { type: Boolean, default: false },
    lastUsed: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);