const mongoose = require("mongoose");

const tdsReconciliationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    financialYear: {
      type: String,
      default: "2025-26",
      index: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      index: true,
    },
    invoiceNumber: {
      type: String,
      trim: true,
    },
    incomeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Income",
    },
    bankTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CanonicalTransaction",
    },
    tdsRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TDSRecord",
      index: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    invoiceAmount: {
      type: Number,
      default: 0,
    },
    expectedTdsAmount: {
      type: Number,
      default: 0,
    },
    actualTdsDeducted: {
      type: Number,
      default: 0,
    },
    bankReceivedAmount: {
      type: Number,
      default: 0,
    },
    discrepancyAmount: {
      type: Number,
      default: 0,
    },
    matchStatus: {
      type: String,
      enum: [
        "MATCHED",
        "PARTIAL_MATCH",
        "TDS_MISMATCH",
        "BANK_MISMATCH",
        "MISSING_TDS",
        "MISSING_PAYMENT",
        "DUPLICATE",
        "REVIEW_REQUIRED",
        "UNRESOLVED",
      ],
      required: true,
      index: true,
    },
    matchConfidence: {
      type: Number,
      default: 1.0,
    },
    matchType: {
      type: String,
      enum: ["EXACT", "FUZZY_ML", "MANUAL", "UNMATCHED"],
      default: "EXACT",
    },
    discrepancyReasons: [
      {
        type: String,
      },
    ],
    suggestedAction: {
      type: String,
    },
    reconciledAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TDSReconciliation", tdsReconciliationSchema);
