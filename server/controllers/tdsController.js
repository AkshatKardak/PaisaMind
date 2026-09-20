const asyncHandler = require("express-async-handler");
const TDSRecord = require("../models/TDSRecord");
const TDSReconciliation = require("../models/TDSReconciliation");
const { run3WayTDSReconciliation } = require("../services/tdsReconciliationService");
const { logAuditEvent } = require("../services/auditService");

/**
 * Run 3-Way TDS Reconciliation and return comprehensive audit report
 */
const getReconciliationReport = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { financialYear = "2025-26" } = req.query;

  const report = await run3WayTDSReconciliation(userId, { financialYear });

  return res.status(200).json({
    success: true,
    data: report,
  });
});

/**
 * Import or create TDS records from Form 26AS / AIS / Form 16A
 */
const importTdsRecords = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { records = [], financialYear = "2025-26", source = "26AS_IMPORT" } = req.body;

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please provide an array of TDS records to import.",
    });
  }

  const createdDocs = [];
  for (const item of records) {
    if (!item.deductorName || item.creditAmount === undefined || item.tdsDeducted === undefined) {
      continue;
    }

    const doc = await TDSRecord.create({
      userId,
      deductorName: String(item.deductorName).trim(),
      deductorTAN: item.deductorTAN ? String(item.deductorTAN).trim().toUpperCase() : undefined,
      deductorPAN: item.deductorPAN ? String(item.deductorPAN).trim().toUpperCase() : undefined,
      section: item.section || "194J",
      financialYear: item.financialYear || financialYear,
      assessmentYear: item.assessmentYear || "2026-27",
      transactionDate: item.transactionDate ? new Date(item.transactionDate) : new Date(),
      creditAmount: Number(item.creditAmount),
      tdsDeducted: Number(item.tdsDeducted),
      tdsDeposited: item.tdsDeposited !== undefined ? Number(item.tdsDeposited) : Number(item.tdsDeducted),
      challanNumber: item.challanNumber,
      certificateNumber: item.certificateNumber,
      source,
      metadata: item.metadata || {},
    });

    createdDocs.push(doc);
  }

  await logAuditEvent({
    userId,
    action: "TDS_RECORDS_IMPORTED",
    resource: "TDSRecord",
    details: { count: createdDocs.length, source, financialYear },
    req,
  });

  return res.status(201).json({
    success: true,
    data: {
      importedCount: createdDocs.length,
      records: createdDocs,
      message: `Successfully imported ${createdDocs.length} Form 26AS TDS records.`,
    },
  });
});

/**
 * Get all imported TDS records for user
 */
const getTdsRecords = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { financialYear = "2025-26" } = req.query;

  const records = await TDSRecord.find({ userId, financialYear }).sort({ transactionDate: -1 });

  return res.status(200).json({
    success: true,
    data: records,
  });
});

/**
 * Manual override reconciliation link
 */
const manualReconcile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { invoiceId, tdsRecordId, incomeId, notes } = req.body;

  if (!invoiceId) {
    return res.status(400).json({ success: false, message: "invoiceId is required for manual linking." });
  }

  const recon = await TDSReconciliation.create({
    userId,
    invoiceId,
    tdsRecordId,
    incomeId,
    clientName: req.body.clientName || "Manual Reconciled",
    invoiceAmount: req.body.invoiceAmount || 0,
    expectedTdsAmount: req.body.expectedTdsAmount || 0,
    actualTdsDeducted: req.body.actualTdsDeducted || 0,
    bankReceivedAmount: req.body.bankReceivedAmount || 0,
    matchStatus: "MATCHED",
    matchConfidence: 1.0,
    matchType: "MANUAL",
    discrepancyReasons: notes ? [notes] : [],
    suggestedAction: "Manually verified and reconciled by user.",
    reconciledAt: new Date(),
  });

  if (tdsRecordId) {
    await TDSRecord.findOneAndUpdate({ _id: tdsRecordId, userId }, { reconciliationStatus: "MATCHED" });
  }

  return res.status(200).json({
    success: true,
    data: recon,
    message: "Transaction manually reconciled successfully.",
  });
});

module.exports = {
  getReconciliationReport,
  importTdsRecords,
  getTdsRecords,
  manualReconcile,
};
