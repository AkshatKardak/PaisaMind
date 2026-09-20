const crypto = require("crypto");
const { stringSimilarity } = require("./anomalyService");

/**
 * Validates and normalizes raw ingested transactions into canonical ledger records
 */
const validateAndNormalizeLedger = async (rawTransactions = [], existingLedger = []) => {
  const normalized = [];
  const minValidYear = 1990;
  const maxValidYear = new Date().getFullYear() + 1;

  for (let i = 0; i < rawTransactions.length; i++) {
    const raw = rawTransactions[i];
    const flags = [];
    let status = "VALIDATED";

    // 1. Transaction ID
    const txId = raw.transactionId || crypto.randomUUID();

    // 2. Date Validation
    let parsedDate = raw.parsedDate ? new Date(raw.parsedDate) : new Date(raw.rawDate || Date.now());
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date();
      flags.push("INVALID_DATE_FALLBACK_TO_NOW");
      status = "REVIEW_REQUIRED";
    } else {
      const year = parsedDate.getFullYear();
      if (year < minValidYear || year > maxValidYear) {
        flags.push("ANOMALOUS_DATE_YEAR_OUT_OF_BOUNDS");
        status = "REVIEW_REQUIRED";
      }
    }

    // 3. Amount Validation
    const amount = Number(raw.amount || 0);
    if (isNaN(amount) || amount <= 0) {
      flags.push("ZERO_OR_NEGATIVE_AMOUNT");
      status = "REJECTED";
    }

    // 4. Type Validation
    const type = ["income", "expense", "transfer"].includes(raw.type) ? raw.type : "expense";

    // 5. Confidence Evaluation
    const extractionConfidence = Number(raw.extractionConfidence ?? (raw.extractionMethod === "vision_ocr" ? 0.80 : 0.95));
    const categorizationConfidence = Number(raw.confidence ?? raw.categorizationConfidence ?? 0.70);

    if (extractionConfidence < 0.70 || categorizationConfidence < 0.60) {
      if (status !== "REJECTED") status = "REVIEW_REQUIRED";
      flags.push("LOW_CONFIDENCE_SCORE");
    }

    // 6. Running Balance Continuity Check
    const currentBalance = raw.balance !== undefined && raw.balance !== null ? Number(raw.balance) : null;
    if (i > 0 && currentBalance !== null && normalized[i - 1].balanceAfter !== null) {
      const prevBal = normalized[i - 1].balanceAfter;
      const expectedBal = type === "income" ? prevBal + amount : prevBal - amount;
      const discrepancy = Math.abs(currentBalance - expectedBal);

      if (discrepancy > 1.0) {
        flags.push(`BALANCE_DISCREPANCY_DELTA_${Math.round(discrepancy)}`);
        if (status !== "REJECTED") status = "REVIEW_REQUIRED";
      }
    }

    // 7. Duplicate Detection (against previously processed batch items and existing records)
    let isDuplicate = false;
    let duplicateOf = null;

    // Check against current batch
    for (let j = 0; j < normalized.length; j++) {
      const prev = normalized[j];
      const amtMatch = Math.abs(prev.amount - amount) < 0.01;
      const dateDiff = Math.abs((prev.date - parsedDate) / (1000 * 60 * 60 * 24));
      if (amtMatch && dateDiff <= 2 && prev.type === type) {
        const sim = stringSimilarity(prev.rawDescription, raw.rawDescription || "");
        if (sim >= 0.70) {
          isDuplicate = true;
          duplicateOf = prev.transactionId;
          flags.push("BATCH_DUPLICATE_DETECTED");
          status = "DUPLICATE";
          break;
        }
      }
    }

    // Check against existing database records
    if (!isDuplicate && existingLedger && existingLedger.length > 0) {
      const match = existingLedger.find((ex) => {
        const amtMatch = Math.abs(ex.amount - amount) < 0.01;
        const exDate = new Date(ex.date);
        const dateDiff = Math.abs((exDate - parsedDate) / (1000 * 60 * 60 * 24));
        return amtMatch && dateDiff <= 2;
      });

      if (match) {
        isDuplicate = true;
        duplicateOf = String(match._id || match.transactionId || "");
        flags.push("DATABASE_DUPLICATE_DETECTED");
        status = "DUPLICATE";
      }
    }

    normalized.push({
      transactionId: txId,
      date: parsedDate,
      amount: Math.round(amount * 100) / 100,
      type,
      category: raw.categoryOverride || raw.suggestedCategory || raw.category || "Other",
      categorySource: raw.categorySource || (raw.confidence > 0.9 ? "user_rule" : "ml_classifier"),
      rawDescription: String(raw.rawDescription || raw.description || "Transaction").trim(),
      normalizedMerchant: String(raw.normalizedMerchant || "").trim(),
      source: raw.source || "statement_pdf",
      sourcePage: raw.sourcePage !== undefined ? raw.sourcePage : null,
      extractionMethod: raw.extractionMethod || "regex_text",
      extractionConfidence,
      categorizationConfidence,
      validationStatus: status,
      validationFlags: flags,
      reference: String(raw.reference || "").trim(),
      balanceAfter: currentBalance,
      isDuplicate,
      duplicateOf,
      selected: status !== "DUPLICATE" && status !== "REJECTED",
    });
  }

  return normalized;
};

module.exports = {
  validateAndNormalizeLedger,
};
