const { parse: parseCsv } = require("csv-parse/sync");
const xlsx = require("xlsx");
let pdfParse;
try {
  pdfParse = require("pdf-parse");
} catch (e) {}

let Groq;
try {
  Groq = require("groq-sdk");
} catch (e) {}

const getGroqClient = () => {
  if (!Groq) return null;
  const key = process.env.GROQ_API_KEY;
  if (!key || key === "your_groq_api_key") return null;
  return new Groq({ apiKey: key });
};

const { categorizeTransaction } = require("./categorizationService");
const { normalizeMerchant } = require("./recurringIntelligenceService");
const { extractPdfPagesStreaming } = require("./documentProcessingService");
const { validateAndNormalizeLedger } = require("./ledgerValidationService");
const Expense = require("../models/Expense");
const Income = require("../models/Income");

/**
 * Standard Indian date string parsers
 */
const parseFlexibleDate = (raw) => {
  if (!raw) return new Date();
  if (raw instanceof Date && !isNaN(raw)) return raw;

  const str = String(raw).trim();
  // Try direct parse
  const direct = new Date(str);
  if (!isNaN(direct.getTime()) && str.includes("-") && str.length === 10 && str.indexOf("-") === 4) {
    return direct; // YYYY-MM-DD
  }

  // Common Indian formats: DD/MM/YYYY, DD-MM-YYYY, DD/MM/YY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;
    const parsed = new Date(year, month, day);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // Format: DD Mon YYYY (e.g. 15 Aug 2026 or 15-Aug-2026)
  const monMatch = str.match(/^(\d{1,2})[\s\-]+([A-Za-z]{3,9})[\s\-]+(\d{2,4})/);
  if (monMatch) {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return !isNaN(direct.getTime()) ? direct : new Date();
};

/**
 * Normalizes amount string (handles "1,250.00 CR", "-500", "₹ 4,500.50", "DR")
 */
const parseCleanAmount = (val) => {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return Math.abs(val);

  const clean = String(val)
    .replace(/[₹$,\s]/g, "")
    .replace(/cr/i, "")
    .replace(/dr/i, "")
    .trim();

  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.abs(num);
};

/**
 * Guesses column mappings from raw table headers
 */
const detectColumnMapping = (headers = []) => {
  const mapping = {
    date: null,
    description: null,
    debit: null,
    credit: null,
    amount: null,
    type: null,
    balance: null,
    reference: null,
  };

  headers.forEach((h, idx) => {
    const col = String(h || "").toLowerCase().trim();
    if (!mapping.date && (col.includes("date") || col.includes("txn date") || col.includes("value date") || col.includes("trans date"))) {
      mapping.date = h;
    } else if (!mapping.description && (col.includes("narration") || col.includes("description") || col.includes("particular") || col.includes("remarks") || col.includes("details"))) {
      mapping.description = h;
    } else if (!mapping.debit && (col.includes("debit") || col.includes("withdrawal") || col.includes("dr"))) {
      mapping.debit = h;
    } else if (!mapping.credit && (col.includes("credit") || col.includes("deposit") || col.includes("cr"))) {
      mapping.credit = h;
    } else if (!mapping.amount && (col.includes("amount") || col.includes("txn amount"))) {
      mapping.amount = h;
    } else if (!mapping.balance && (col.includes("balance") || col.includes("bal"))) {
      mapping.balance = h;
    } else if (!mapping.reference && (col.includes("chq") || col.includes("ref") || col.includes("utr") || col.includes("txn id") || col.includes("cheque"))) {
      mapping.reference = h;
    }
  });

  return mapping;
};

/**
 * Parses CSV buffer into structured rows
 */
const parseCsvStatement = (buffer) => {
  const content = buffer.toString("utf-8");
  const records = parseCsv(content, {
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  });

  if (records.length < 2) throw new Error("CSV file has insufficient rows or headers.");

  // Find header row (row containing date/narration keywords)
  let headerIndex = 0;
  for (let i = 0; i < Math.min(10, records.length); i++) {
    const rowStr = records[i].join(" ").toLowerCase();
    if (rowStr.includes("date") && (rowStr.includes("narration") || rowStr.includes("particular") || rowStr.includes("description") || rowStr.includes("amount") || rowStr.includes("debit"))) {
      headerIndex = i;
      break;
    }
  }

  const headers = records[headerIndex];
  const rows = records.slice(headerIndex + 1).map((row) => {
    const obj = { extractionMethod: "csv_direct", sourcePage: null };
    headers.forEach((h, idx) => {
      obj[h] = row[idx] !== undefined ? row[idx] : "";
    });
    return obj;
  });

  return { headers, rows, columnMapping: detectColumnMapping(headers) };
};

/**
 * Parses XLSX buffer into structured rows
 */
const parseXlsxStatement = (buffer) => {
  const workbook = xlsx.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false });

  if (rawData.length < 2) throw new Error("Excel sheet has insufficient rows.");

  let headerIndex = 0;
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const rowStr = (rawData[i] || []).join(" ").toLowerCase();
    if (rowStr.includes("date") && (rowStr.includes("narration") || rowStr.includes("particular") || rowStr.includes("description") || rowStr.includes("amount") || rowStr.includes("debit"))) {
      headerIndex = i;
      break;
    }
  }

  const headers = (rawData[headerIndex] || []).map((h) => String(h || "").trim());
  const rows = rawData.slice(headerIndex + 1).filter((r) => r.length > 0).map((row) => {
    const obj = { extractionMethod: "excel_sheet", sourcePage: null };
    headers.forEach((h, idx) => {
      obj[h] = row[idx] !== undefined ? row[idx] : "";
    });
    return obj;
  });

  return { headers, rows, columnMapping: detectColumnMapping(headers) };
};

/**
 * Vision LLM extractor for image buffers (scanned passbook photos, JPG/PNG)
 */
const parseImageWithVision = async (buffer, mimeType = "image/jpeg") => {
  const groq = getGroqClient();
  if (!groq) return null;

  try {
    const base64Data = buffer.toString("base64");
    const response = await groq.chat.completions.create({
      model: "llama-3.2-11b-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "You are an Indian bank statement extraction engine. Extract all financial transactions from this document/image into a clean JSON array of objects. Each object MUST have keys: 'Date' (YYYY-MM-DD or DD/MM/YYYY), 'Description' (narration/merchant), 'Debit' (withdrawal amount or empty string), 'Credit' (deposit amount or empty string), 'Balance' (running balance or empty string). Return ONLY the raw JSON array without markdown backticks or explanation.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
              },
            },
          ],
        },
      ],
      temperature: 0.1,
    });

    const raw = response.choices?.[0]?.message?.content?.trim() || "";
    const cleaned = raw.replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed)
      ? parsed.map((item) => ({ ...item, extractionMethod: "vision_ocr", sourcePage: 1 }))
      : null;
  } catch (err) {
    return null;
  }
};

/**
 * Parses text-based PDF statements using streaming page-by-page pipeline (NO TRUNCATION)
 */
const parsePdfStatement = async (buffer, documentId) => {
  if (!pdfParse) throw new Error("PDF parsing module is not available. Please use CSV or Excel.");

  // Use streaming page-by-page extraction without truncation
  const extraction = await extractPdfPagesStreaming(buffer, documentId);
  const {
    rows,
    totalPages,
    processedPages,
    failedPages,
    scannedPagesCount,
    extractedCount,
    rejectedCount,
    reviewRequiredCount,
  } = extraction;

  const headers = ["Date", "Description", "Debit", "Credit", "Balance"];

  if (rows && rows.length > 0) {
    return {
      headers,
      rows,
      columnMapping: detectColumnMapping(headers),
      totalPages,
      processedPages,
      failedPages,
      scannedPagesCount,
      extractedCount,
      rejectedCount,
      reviewRequiredCount,
      documentId: extraction.documentId,
    };
  }

  // If no rows found and all pages were scanned images, try Vision OCR fallback on entire buffer
  if (scannedPagesCount > 0) {
    const visionRows = await parseImageWithVision(buffer, "application/pdf");
    if (visionRows && visionRows.length > 0) {
      return {
        headers,
        rows: visionRows.map((r) => ({
          ...r,
          documentId: extraction.documentId,
          sourcePage: 1,
          extractionMethod: "vision_ocr",
          extractionConfidence: 0.85,
        })),
        columnMapping: detectColumnMapping(headers),
        totalPages,
        processedPages: 1,
        failedPages: 0,
        scannedPagesCount,
        extractedCount: visionRows.length,
        rejectedCount: 0,
        reviewRequiredCount: 0,
        documentId: extraction.documentId,
      };
    }
  }

  throw new Error(
    "Could not extract transaction tables from this PDF. Please ensure the document is a digital bank statement or export as CSV/Excel."
  );
};

/**
 * Parses camera photos / scanned images (PNG, JPG, JPEG) using Vision OCR
 */
const parseImageStatement = async (buffer, mimeType = "image/jpeg") => {
  const visionRows = await parseImageWithVision(buffer, mimeType);
  if (!visionRows || visionRows.length === 0) {
    throw new Error(
      "Could not extract transaction rows from this passbook/statement photo. For instant zero-error ingestion, please download the digital e-statement (PDF or CSV) directly from your NetBanking portal."
    );
  }

  const headers = ["Date", "Description", "Debit", "Credit", "Balance"];
  return { headers, rows: visionRows, columnMapping: detectColumnMapping(headers) };
};

/**
 * Normalizes parsed rows into canonical validated ledger records
 */
const processStagedTransactions = async (userId, rows, columnMapping) => {
  const [existingExpenses, existingIncomes] = await Promise.all([
    Expense.find({ userId }).select("title amount date"),
    Income.find({ userId }).select("source amount date"),
  ]);

  const candidateDbLedger = [
    ...existingExpenses.map((e) => ({ _id: e._id, amount: e.amount, date: e.date, title: e.title, type: "expense" })),
    ...existingIncomes.map((i) => ({ _id: i._id, amount: i.amount, date: i.date, title: i.source, type: "income" })),
  ];

  const candidateRawList = [];

  for (const row of rows) {
    const rawDate = row[columnMapping.date] || row.Date || "";
    const parsedDate = parseFlexibleDate(rawDate);
    const rawDesc = String(row[columnMapping.description] || row.Description || "Transaction").trim();
    const normalizedMerchant = normalizeMerchant(rawDesc);

    let type = "expense";
    let amount = 0;

    const debitVal = parseCleanAmount(row[columnMapping.debit] || row.Debit);
    const creditVal = parseCleanAmount(row[columnMapping.credit] || row.Credit);

    if (creditVal > 0 && debitVal === 0) {
      type = "income";
      amount = creditVal;
    } else if (debitVal > 0) {
      type = "expense";
      amount = debitVal;
    } else {
      const amtVal = parseCleanAmount(row[columnMapping.amount] || row.Amount);
      amount = amtVal;
      const rowText = Object.values(row).join(" ").toLowerCase();
      if (rowText.includes("cr") || rowText.includes("credit") || rowText.includes("deposit")) {
        type = "income";
      } else {
        type = "expense";
      }
    }

    if (amount <= 0) continue;

    // Automatic Category Prediction
    const { category, confidence, source } = await categorizeTransaction(userId, rawDesc, type);

    candidateRawList.push({
      rawDate: String(rawDate),
      parsedDate,
      rawDescription: rawDesc,
      description: rawDesc,
      normalizedMerchant,
      type,
      amount: Math.round(amount * 100) / 100,
      suggestedCategory: category,
      category,
      categorySource: source,
      confidence,
      categoryOverride: category,
      reference: String(row[columnMapping.reference] || row.Reference || row.reference || ""),
      balance: parseCleanAmount(row[columnMapping.balance] || row.Balance || row.balance),
      documentId: row.documentId || null,
      sourcePage: row.sourcePage !== undefined ? row.sourcePage : null,
      extractionMethod: row.extractionMethod || "regex_text",
      extractionConfidence: row.extractionConfidence || 0.92,
    });
  }

  // Multi-stage validation and duplicate detection
  const validatedLedger = await validateAndNormalizeLedger(candidateRawList, candidateDbLedger);

  return validatedLedger.map((tx) => ({
    ...tx,
    rawDate: tx.date ? new Date(tx.date).toLocaleDateString("en-IN") : "",
    parsedDate: tx.date,
    duplicateReason: tx.isDuplicate ? "Matches existing or concurrent record within 2 days with identical amount." : "",
  }));
};

module.exports = {
  parseCsvStatement,
  parseXlsxStatement,
  parsePdfStatement,
  parseImageStatement,
  detectColumnMapping,
  processStagedTransactions,
  parseFlexibleDate,
  parseCleanAmount,
};
