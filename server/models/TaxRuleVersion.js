const mongoose = require("mongoose");

const taxSlabSchema = new mongoose.Schema(
  {
    limit: { type: Number, default: null }, // null represents Infinity
    rate: { type: Number, required: true },
  },
  { _id: false }
);

const taxRuleVersionSchema = new mongoose.Schema(
  {
    version: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    financialYear: {
      type: String,
      required: true,
      trim: true,
      index: true, // e.g., "2024-25", "2025-26"
    },
    assessmentYear: {
      type: String,
      required: true,
      trim: true,
    },
    effectiveFrom: {
      type: Date,
      required: true,
    },
    effectiveTo: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "SUPERSEDED", "DRAFT", "ARCHIVED"],
      default: "ACTIVE",
      index: true,
    },
    sourceNotification: {
      type: String,
      trim: true,
    },
    sources: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TaxSource",
      },
    ],
    newRegime: {
      section: { type: String, default: "115BAC" },
      standardDeduction: { type: Number, default: 75000 },
      rebate87ALimit: { type: Number, default: 700000 },
      slabs: [taxSlabSchema],
    },
    oldRegime: {
      standardDeduction: { type: Number, default: 50000 },
      rebate87ALimit: { type: Number, default: 500000 },
      max80C: { type: Number, default: 150000 },
      max80D_self: { type: Number, default: 25000 },
      max80D_parents: { type: Number, default: 50000 },
      max80CCD1B: { type: Number, default: 50000 },
      slabs: [taxSlabSchema],
    },
    presumptive: {
      section44ADA: {
        standardGrossLimit: { type: Number, default: 5000000 },
        enhancedGrossLimit: { type: Number, default: 7500000 },
        cashReceiptThresholdPercentage: { type: Number, default: 5.0 },
        presumptiveProfitRate: { type: Number, default: 0.50 },
        eligibleEntities: [{ type: String }],
        ineligibleEntities: [{ type: String }],
        specifiedProfessions: [{ type: String }],
      },
      section44AD: {
        standardGrossLimit: { type: Number, default: 20000000 },
        enhancedGrossLimit: { type: Number, default: 30000000 },
        cashReceiptThresholdPercentage: { type: Number, default: 5.0 },
        digitalProfitRate: { type: Number, default: 0.06 },
        cashProfitRate: { type: Number, default: 0.08 },
      },
    },
    cessRate: {
      type: Number,
      default: 0.04,
    },
    gst: {
      servicesThreshold: { type: Number, default: 2000000 },
      goodsThreshold: { type: Number, default: 4000000 },
      specialStatesThreshold: { type: Number, default: 1000000 },
      warningThreshold: { type: Number, default: 1800000 },
      dangerThreshold: { type: Number, default: 1950000 },
    },
    tds: {
      section194J_technical: { type: Number, default: 0.02 },
      section194J_professional: { type: Number, default: 0.10 },
      section194C_individual: { type: Number, default: 0.01 },
      section194C_company: { type: Number, default: 0.02 },
    },
    advanceTax: {
      section208LiabilityThreshold: { type: Number, default: 10000 },
      schedule: [
        {
          quarter: String,
          dueMonth: Number,
          dueDay: Number,
          label: String,
          cumulativePercentage: Number,
          nextYear: { type: Boolean, default: false },
        },
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TaxRuleVersion", taxRuleVersionSchema);
