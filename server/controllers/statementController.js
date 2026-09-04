const asyncHandler = require("express-async-handler");
const StatementImport = require("../models/StatementImport");
const Income = require("../models/Income");
const Expense = require("../models/Expense");
const {
  parseCsvStatement,
  parseXlsxStatement,
  parsePdfStatement,
  parseImageStatement,
  processStagedTransactions,
} = require("../services/statementParserService");
const { learnCategoryCorrection } = require("../services/categorizationService");
const { logAuditEvent } = require("../services/auditService");
const logger = require("../services/logger");

/**
 * Upload and parse bank statement file
 */
const uploadAndParseStatement = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!req.file) {
    return res.status(400).json({ success: false, message: "No statement file uploaded." });
  }

  const filename = req.file.originalname;
  const ext = filename.split(".").pop().toLowerCase();

  let parseResult;
  try {
    if (ext === "csv") {
      parseResult = parseCsvStatement(req.file.buffer);
    } else if (["xlsx", "xls"].includes(ext)) {
      parseResult = parseXlsxStatement(req.file.buffer);
    } else if (ext === "pdf") {
      parseResult = await parsePdfStatement(req.file.buffer);
    } else if (["png", "jpg", "jpeg"].includes(ext)) {
      parseResult = await parseImageStatement(req.file.buffer, req.file.mimetype || `image/${ext}`);
    } else {
      return res.status(400).json({ success: false, message: "Unsupported file type. Please upload a CSV, Excel (.xlsx), PDF, or passbook photo (PNG/JPG)." });
    }
  } catch (parseErr) {
    logger.warn({ err: parseErr.message, filename }, "[StatementUpload] Parsing failed");
    return res.status(400).json({ success: false, message: `Failed to parse statement: ${parseErr.message}` });
  }

  const { headers, rows, columnMapping } = parseResult;

  // Process rows into staged transactions
  const stagedTransactions = await processStagedTransactions(userId, rows, columnMapping);
  const duplicateCount = stagedTransactions.filter((t) => t.isDuplicate).length;

  const statementDoc = await StatementImport.create({
    userId,
    filename,
    fileType: ext === "xls" ? "xlsx" : ext,
    totalRows: stagedTransactions.length,
    importedRows: 0,
    duplicateRows: duplicateCount,
    status: "staged",
    stagedTransactions,
    columnMapping,
  });

  return res.status(201).json({
    success: true,
    data: {
      importId: statementDoc._id,
      filename,
      headers,
      columnMapping,
      totalRows: stagedTransactions.length,
      duplicateCount,
      transactions: stagedTransactions,
    },
  });
});

/**
 * Re-map columns for an existing staged import
 */
const remapColumns = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { importId, columnMapping } = req.body;

  const doc = await StatementImport.findOne({ _id: importId, userId, status: "staged" });
  if (!doc) return res.status(404).json({ success: false, message: "Staged import session not found." });

  // Update mapping
  doc.columnMapping = columnMapping;
  await doc.save();

  return res.status(200).json({ success: true, message: "Columns remapped successfully." });
});

/**
 * Commit selected staged transactions into permanent database
 */
const commitStatementTransactions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { importId, selectedIndices } = req.body;

  const doc = await StatementImport.findOne({ _id: importId, userId, status: "staged" });
  if (!doc) return res.status(404).json({ success: false, message: "Staged statement not found or already committed." });

  const toCommit = [];
  const indicesSet = selectedIndices ? new Set(selectedIndices) : null;

  doc.stagedTransactions.forEach((tx, idx) => {
    const isSelected = indicesSet ? indicesSet.has(idx) : tx.selected;
    if (isSelected) {
      toCommit.push(tx);
    }
  });

  let incomesCreated = 0;
  let expensesCreated = 0;

  for (const tx of toCommit) {
    const finalCategory = tx.categoryOverride || tx.suggestedCategory || "Other";

    if (tx.type === "income") {
      await Income.create({
        userId,
        source: tx.rawDescription,
        category: finalCategory,
        amount: tx.amount,
        date: tx.parsedDate,
        notes: `Imported from ${doc.filename} (Ref: ${tx.reference || "N/A"})`,
      });
      incomesCreated++;
    } else {
      await Expense.create({
        userId,
        title: tx.rawDescription,
        category: finalCategory,
        amount: tx.amount,
        date: tx.parsedDate,
        notes: `Imported from ${doc.filename} (Ref: ${tx.reference || "N/A"})`,
      });
      expensesCreated++;
    }

    // Learn category override if user modified category
    if (tx.categoryOverride && tx.categoryOverride !== tx.suggestedCategory) {
      await learnCategoryCorrection(userId, tx.normalizedMerchant || tx.rawDescription, tx.categoryOverride, tx.type);
    }
  }

  doc.status = "committed";
  doc.importedRows = toCommit.length;
  await doc.save();

  await logAuditEvent({
    userId,
    action: "BANK_STATEMENT_IMPORTED",
    resource: "StatementImport",
    resourceId: String(doc._id),
    details: { filename: doc.filename, totalImported: toCommit.length, incomesCreated, expensesCreated },
    req,
  });

  return res.status(200).json({
    success: true,
    data: {
      totalImported: toCommit.length,
      incomesCreated,
      expensesCreated,
      message: `Successfully imported ${toCommit.length} transactions (${incomesCreated} income, ${expensesCreated} expenses).`,
    },
  });
});

/**
 * Get import details
 */
const getStatementImport = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const doc = await StatementImport.findOne({ _id: req.params.id, userId });
  if (!doc) return res.status(404).json({ success: false, message: "Statement import not found" });
  return res.status(200).json({ success: true, data: doc });
});

module.exports = {
  uploadAndParseStatement,
  remapColumns,
  commitStatementTransactions,
  getStatementImport,
};
