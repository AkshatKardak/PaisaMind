const mongoose = require("mongoose");

const healthConfigSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "DEFAULT_WEIGHTS",
      unique: true,
    },
    weights: {
      cashFlowStability: { type: Number, default: 15 },
      savingsRate: { type: Number, default: 15 },
      expenseControl: { type: Number, default: 15 },
      emergencyRunway: { type: Number, default: 15 },
      invoiceReliability: { type: Number, default: 10 },
      debtBurden: { type: Number, default: 10 },
      clientConcentration: { type: Number, default: 10 },
      taxReserveCoverage: { type: Number, default: 10 },
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HealthConfig", healthConfigSchema);
