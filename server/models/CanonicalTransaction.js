const mongoose = require("mongoose");

const canonicalTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    type: {
      type: String,
      required: true,
      enum: ["income", "expense", "transfer"],
      index: true,
    },
    category: {
      type: String,
      required: true,
      default: "Other",
      index: true,
    },
    categorySource: {
      type: String,
      enum: ["user_rule", "ml_classifier", "merchant_dictionary", "llm_fallback", "user_override", "default"],
      default: "default",
    },
    rawDescription: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedMerchant: {
      type: String,
      trim: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["statement_pdf", "statement_csv", "statement_excel", "manual", "invoice", "bank_sync"],
      default: "statement_pdf",
      index: true,
    },
    sourcePage: {
      type: Number,
      default: null, // page index in multi-page PDF statements
    },
    extractionMethod: {
      type: String,
      enum: ["pdf_table", "regex_text", "vision_ocr", "csv_direct", "excel_sheet", "manual_entry"],
      default: "regex_text",
    },
    extractionConfidence: {
      type: Number,
      min: 0.0,
      max: 1.0,
      default: 1.0,
    },
    categorizationConfidence: {
      type: Number,
      min: 0.0,
      max: 1.0,
      default: 0.5,
    },
    validationStatus: {
      type: String,
      enum: ["VALIDATED", "REVIEW_REQUIRED", "REJECTED", "DUPLICATE", "CONFLICT", "UNCERTAIN"],
      default: "VALIDATED",
      index: true,
    },
    validationFlags: [
      {
        type: String,
      },
    ],
    reference: {
      type: String,
      trim: true,
    },
    balanceAfter: {
      type: Number,
      default: null,
    },
    isDuplicate: {
      type: Boolean,
      default: false,
    },
    duplicateOf: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound indexes for high-frequency queries
canonicalTransactionSchema.index({ userId: 1, date: -1 });
canonicalTransactionSchema.index({ userId: 1, type: 1, date: -1 });
canonicalTransactionSchema.index({ userId: 1, validationStatus: 1 });

module.exports = mongoose.model("CanonicalTransaction", canonicalTransactionSchema);
