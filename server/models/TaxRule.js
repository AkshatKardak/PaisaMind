const mongoose = require("mongoose");

const taxRuleSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["INCOME_TAX_SLAB", "DEDUCTION", "REBATE", "PRESUMPTIVE", "GST", "TDS", "ADVANCE_TAX", "CESS"],
    },
    description: {
      type: String,
      required: true,
    },
    ruleData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    source: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaxSource",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TaxRule", taxRuleSchema);
