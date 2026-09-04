const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    action: {
      type: String,
      required: true,
      enum: [
        "TRANSACTION_CREATED",
        "TRANSACTION_UPDATED",
        "TRANSACTION_DELETED",
        "INVOICE_CREATED",
        "INVOICE_UPDATED",
        "INVOICE_DELETED",
        "TAX_CONFIGURATION_CHANGED",
        "BANK_STATEMENT_IMPORTED",
        "AI_FINANCIAL_QUERY",
        "SCENARIO_SIMULATED",
        "ASSET_MODIFIED",
        "LIABILITY_MODIFIED",
        "DUPLICATE_RESOLVED",
      ],
    },
    resource: { type: String, required: true },
    resourceId: { type: String },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    result: { type: String, enum: ["SUCCESS", "FAILURE", "WARNING"], default: "SUCCESS" },
  },
  { timestamps: true }
);

auditLogSchema.index({ userId: 1, action: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
