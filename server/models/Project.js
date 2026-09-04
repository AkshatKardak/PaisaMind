const mongoose = require("mongoose");

const projectExpenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    category: { type: String, default: "Direct Project Cost" },
  },
  { _id: true }
);

const projectHourLogSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    hours: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    clientName: { type: String, required: true, trim: true, index: true },
    feeType: {
      type: String,
      enum: ["fixed", "hourly", "retainer"],
      default: "fixed",
    },
    totalBilled: { type: Number, default: 0 },
    targetHourlyRate: { type: Number, default: 2500 }, // in INR
    loggedHours: { type: Number, default: 0 },
    directExpenses: { type: Number, default: 0 },
    hoursLog: [projectHourLogSchema],
    expenseLog: [projectExpenseSchema],
    status: {
      type: String,
      enum: ["active", "completed", "paused"],
      default: "active",
    },
    startDate: { type: Date, default: Date.now },
    deadline: { type: Date },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

projectSchema.index({ userId: 1, clientName: 1 });
projectSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("Project", projectSchema);
