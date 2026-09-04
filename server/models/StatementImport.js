const mongoose = require("mongoose");

const stagedTransactionSchema = new mongoose.Schema(
  {
    rawDate: { type: String },
    parsedDate: { type: Date, required: true },
    rawDescription: { type: String, required: true },
    normalizedMerchant: { type: String, default: "" },
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true },
    suggestedCategory: { type: String, default: "Other" },
    confidence: { type: Number, default: 0.5 },
    categoryOverride: { type: String },
    reference: { type: String, default: "" },
    balance: { type: Number },
    isDuplicate: { type: Boolean, default: false },
    duplicateReason: { type: String, default: "" },
    selected: { type: Boolean, default: true },
  },
  { _id: true }
);

const statementImportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    filename: { type: String, required: true },
    fileType: { type: String, enum: ["csv", "xlsx", "xls", "pdf"], required: true },
    bankName: { type: String, default: "Generic" },
    totalRows: { type: Number, default: 0 },
    importedRows: { type: Number, default: 0 },
    duplicateRows: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["staged", "committed", "discarded"],
      default: "staged",
    },
    stagedTransactions: [stagedTransactionSchema],
    columnMapping: { type: mongoose.Schema.Types.Mixed, default: {} },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

statementImportSchema.index({ userId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("StatementImport", statementImportSchema);
