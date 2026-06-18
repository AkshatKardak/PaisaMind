const mongoose = require("mongoose");

const recurringSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type:      { type: String, enum: ["income", "expense"], required: true },
    title:     { type: String, required: true },
    category:  { type: String, required: true },
    amount:    { type: Number, required: true },
    frequency: { type: String, enum: ["daily", "weekly", "monthly"], default: "monthly" },
    nextRunAt: { type: Date, required: true },
    active:    { type: Boolean, default: true },
    notes:     { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RecurringTransaction", recurringSchema);
