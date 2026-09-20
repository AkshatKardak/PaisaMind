const Invoice = require("../models/Invoice");
const Income = require("../models/Income");
const CanonicalTransaction = require("../models/CanonicalTransaction");
const TDSRecord = require("../models/TDSRecord");
const TDSReconciliation = require("../models/TDSReconciliation");
const { stringSimilarity } = require("./anomalyService");
const { getActiveRules } = require("./taxRuleResolver");

const CORPORATE_STOPWORDS = new Set([
  "pvt", "ltd", "private", "limited", "llp", "inc", "corp", "co", "company",
  "services", "technologies", "technology", "tech", "solutions", "india", "consulting", "consultancy",
]);

/**
 * Normalizes text for comparison (lowercases, removes punctuation & common entity words)
 */
const normalizeEntityName = (name) => {
  if (!name) return "";
  const tokens = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !CORPORATE_STOPWORDS.has(w));
  return tokens.join("");
};

/**
 * Extracts key business tokens
 */
const extractEntityTokens = (name) => {
  if (!name) return [];
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !CORPORATE_STOPWORDS.has(w));
};

/**
 * Calculates match score between two entities using raw string, normalized string, and token overlap similarity
 */
const calculateEntitySimilarity = (name1, name2) => {
  if (!name1 || !name2) return 0;
  const rawSim = stringSimilarity(name1, name2);
  const norm1 = normalizeEntityName(name1);
  const norm2 = normalizeEntityName(name2);
  const normSim = stringSimilarity(norm1, norm2);

  // Token Overlap Similarity (e.g. "Acme Technologies" vs "Acme Tech")
  const tokens1 = extractEntityTokens(name1);
  const tokens2 = extractEntityTokens(name2);
  let tokenSim = 0;
  if (tokens1.length > 0 && tokens2.length > 0) {
    const set2 = new Set(tokens2);
    const common = tokens1.filter((t) => set2.has(t));
    tokenSim = common.length / Math.min(tokens1.length, tokens2.length);
  }

  return Math.max(rawSim, normSim, tokenSim);
};

/**
 * 3-Way TDS Reconciliation Engine:
 * Invoice <-> Expected TDS <-> Bank Receipt <-> Form 26AS/AIS TDSRecord
 */
const run3WayTDSReconciliation = async (userId, options = {}) => {
  const fy = options.financialYear || "2025-26";
  const rules = await getActiveRules(fy);
  const defaultTdsRate = rules.tds?.section194J_professional || 0.10;

  // 1. Fetch Invoices, Incomes, and TDSRecords for this user
  const [invoices, incomes, bankTxns, tdsRecords] = await Promise.all([
    Invoice.find({ userId }),
    Income.find({ userId }),
    CanonicalTransaction ? CanonicalTransaction.find({ userId, type: "INCOME" }).catch(() => []) : [],
    TDSRecord.find({ userId, financialYear: fy }),
  ]);

  // Merge bank incomes & canonical transactions
  const combinedBankReceipts = [
    ...incomes.map((inc) => ({
      _id: inc._id,
      amount: Number(inc.amount || 0),
      date: inc.date,
      source: inc.source || "",
      notes: inc.notes || "",
      type: "income",
    })),
    ...bankTxns.map((tx) => ({
      _id: tx._id,
      amount: Number(tx.amount || 0),
      date: tx.transactionDate,
      source: tx.description || tx.normalizedMerchant || "",
      notes: tx.reference || "",
      type: "canonical",
    })),
  ];

  const usedTdsRecordIds = new Set();
  const usedBankReceiptIds = new Set();
  const reconciliationResults = [];

  // Track duplicate TDS records in 26AS
  const tdsKeyCount = new Map();
  tdsRecords.forEach((r) => {
    const key = `${r.deductorName}_${r.creditAmount}_${r.tdsDeducted}`;
    tdsKeyCount.set(key, (tdsKeyCount.get(key) || 0) + 1);
  });

  // 2. Iterate through each Invoice and perform 3-way matching
  for (const inv of invoices) {
    const invAmount = Number(inv.amount || inv.totalAmount || 0);
    const rate = inv.tdsRate !== undefined && inv.tdsRate !== null ? Number(inv.tdsRate) / 100 : defaultTdsRate;
    const expectedTds = Math.round(invAmount * rate);
    const expectedNetReceivable = invAmount - expectedTds;
    const invDate = new Date(inv.issueDate || inv.date || inv.createdAt || Date.now());

    // Step A: Find best matching Bank Receipt
    let bestBank = null;
    let bestBankConfidence = 0;
    let bankMatchType = "UNMATCHED";

    for (const b of combinedBankReceipts) {
      if (usedBankReceiptIds.has(String(b._id))) continue;

      const amtDiff = Math.abs(b.amount - expectedNetReceivable);
      const grossAmtDiff = Math.abs(b.amount - invAmount);
      const isNetMatch = amtDiff <= 5; // tolerance
      const isGrossMatch = grossAmtDiff <= 5; // client paid without deducting TDS

      const textToSearch = `${b.source} ${b.notes}`.toLowerCase();
      const entitySim = calculateEntitySimilarity(inv.clientName, b.source);
      const invNumMatch = inv.invoiceNumber && textToSearch.includes(inv.invoiceNumber.toLowerCase());

      const bDate = new Date(b.date);
      const daysDiff = (bDate - invDate) / (1000 * 60 * 60 * 24);
      const isDatePlausible = daysDiff >= -15 && daysDiff <= 120;

      let score = 0;
      if (isNetMatch || isGrossMatch) score += 0.5;
      if (invNumMatch) score += 0.35;
      if (entitySim >= 0.7) score += 0.25;
      else if (entitySim >= 0.4) score += 0.15;
      if (isDatePlausible) score += 0.1;

      if (score > bestBankConfidence && score >= 0.45) {
        bestBankConfidence = score;
        bestBank = b;
        bankMatchType = invNumMatch && (isNetMatch || isGrossMatch) ? "EXACT" : "FUZZY_ML";
      }
    }

    if (bestBank) {
      usedBankReceiptIds.add(String(bestBank._id));
    }

    // Step B: Find best matching TDSRecord (Form 26AS)
    let bestTds = null;
    let bestTdsConfidence = 0;
    let tdsMatchType = "UNMATCHED";

    for (const t of tdsRecords) {
      if (usedTdsRecordIds.has(String(t._id))) continue;

      const creditDiff = Math.abs(t.creditAmount - invAmount);
      const tdsDiff = Math.abs(t.tdsDeducted - expectedTds);
      const isCreditMatch = creditDiff <= 10;
      const isTdsMatch = tdsDiff <= 5;

      const entitySim = calculateEntitySimilarity(inv.clientName, t.deductorName);
      const tDate = new Date(t.transactionDate);
      const daysDiff = (tDate - invDate) / (1000 * 60 * 60 * 24);
      const isDatePlausible = daysDiff >= -30 && daysDiff <= 150;

      let score = 0;
      if (isCreditMatch) score += 0.4;
      if (isTdsMatch) score += 0.3;
      if (entitySim >= 0.7) score += 0.3;
      else if (entitySim >= 0.4) score += 0.15;
      if (isDatePlausible) score += 0.1;

      if (score > bestTdsConfidence && score >= 0.45) {
        bestTdsConfidence = score;
        bestTds = t;
        tdsMatchType = isCreditMatch && isTdsMatch && entitySim >= 0.7 ? "EXACT" : "FUZZY_ML";
      }
    }

    if (bestTds) {
      usedTdsRecordIds.add(String(bestTds._id));
    }

    // Step C: Status Resolution (All 9 statutory statuses)
    let matchStatus = "UNRESOLVED";
    const discrepancyReasons = [];
    let suggestedAction = "";
    let discrepancyAmount = 0;

    const hasBank = Boolean(bestBank);
    const hasTds = Boolean(bestTds);
    const bankAmt = bestBank ? bestBank.amount : 0;
    const actualTdsAmt = bestTds ? bestTds.tdsDeducted : 0;

    const isDuplicateTds = bestTds && (tdsKeyCount.get(`${bestTds.deductorName}_${bestTds.creditAmount}_${bestTds.tdsDeducted}`) > 1);

    if (isDuplicateTds) {
      matchStatus = "DUPLICATE";
      discrepancyReasons.push(`Multiple duplicate TDS entries found in Form 26AS for client ${bestTds.deductorName} with identical amount ₹${bestTds.tdsDeducted}.`);
      suggestedAction = "Verify whether client filed revised quarterly TDS return (Form 26Q) or if redundant entries were imported.";
    } else if (hasBank && hasTds) {
      const tdsDifference = Math.abs(actualTdsAmt - expectedTds);
      const bankDifference = Math.abs(bankAmt - expectedNetReceivable);

      if (tdsDifference <= 5 && bankDifference <= 5) {
        matchStatus = "MATCHED";
        suggestedAction = "Full 3-way reconciliation confirmed. Claim full TDS credit in ITR filing.";
      } else if (tdsDifference > 5 && bankDifference <= 5) {
        matchStatus = "TDS_MISMATCH";
        discrepancyAmount = tdsDifference;
        discrepancyReasons.push(
          `Expected TDS is ₹${expectedTds.toLocaleString("en-IN")} (${Math.round(rate * 100)}%), but Form 26AS reflects ₹${actualTdsAmt.toLocaleString("en-IN")}.`
        );
        suggestedAction = `Contact ${inv.clientName} accounts team to clarify TDS deduction rate difference (₹${tdsDifference.toLocaleString("en-IN")}).`;
      } else if (tdsDifference <= 5 && bankDifference > 5) {
        matchStatus = "BANK_MISMATCH";
        discrepancyAmount = bankDifference;
        discrepancyReasons.push(
          `Expected bank net receipt is ₹${expectedNetReceivable.toLocaleString("en-IN")}, but actual received deposit is ₹${bankAmt.toLocaleString("en-IN")}.`
        );
        suggestedAction = `Check bank statement for wire transfer fees, foreign exchange charges, or partial payment deduction of ₹${bankDifference.toLocaleString("en-IN")}.`;
      } else {
        matchStatus = "REVIEW_REQUIRED";
        discrepancyAmount = Math.max(tdsDifference, bankDifference);
        discrepancyReasons.push("Both TDS deduction and bank deposit differ from invoice terms.");
        suggestedAction = "Manual accountant review required to cross-verify client ledger.";
      }
    } else if (hasBank && !hasTds) {
      const daysSinceBank = (Date.now() - new Date(bestBank.date).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceBank > 45) {
        matchStatus = "MISSING_TDS";
        discrepancyAmount = expectedTds;
        discrepancyReasons.push(
          `Payment of ₹${bankAmt.toLocaleString("en-IN")} received, but no corresponding Form 26AS/AIS TDS credit (₹${expectedTds.toLocaleString("en-IN")}) has been deposited by client.`
        );
        suggestedAction = `Request Form 16A TDS Certificate from ${inv.clientName}. Ensure they have filed Form 26Q with your correct PAN.`;
      } else {
        matchStatus = "PARTIAL_MATCH";
        discrepancyReasons.push("Bank payment received. Client has not yet filed quarterly TDS return or credit is pending update in TRACES.");
        suggestedAction = "Awaiting TRACES quarterly update. Follow up with client if not updated by next quarter.";
      }
    } else if (!hasBank && hasTds) {
      matchStatus = "MISSING_PAYMENT";
      discrepancyAmount = invAmount - actualTdsAmt;
      discrepancyReasons.push(
        `Form 26AS reflects TDS credit of ₹${actualTdsAmt.toLocaleString("en-IN")} against ₹${bestTds.creditAmount.toLocaleString("en-IN")} credit, but no corresponding bank deposit found.`
      );
      suggestedAction = `Verify whether payment from ${inv.clientName} was credited to a different bank account or is pending wire release.`;
    } else {
      // Neither bank nor TDS
      matchStatus = "UNRESOLVED";
      discrepancyAmount = invAmount;
      discrepancyReasons.push("No bank receipt or Form 26AS TDS record found matching this invoice.");
      suggestedAction = "Invoice is outstanding or unrecorded. Send payment reminder to client.";
    }

    const overallConfidence = Math.round(
      Math.max(0.2, (bestBankConfidence * 0.5 + bestTdsConfidence * 0.5)) * 100
    ) / 100;

    reconciliationResults.push({
      userId,
      financialYear: fy,
      invoiceId: inv._id,
      invoiceNumber: inv.invoiceNumber || "N/A",
      incomeId: bestBank?._id || null,
      tdsRecordId: bestTds?._id || null,
      clientName: inv.clientName || "Unknown Client",
      invoiceAmount: invAmount,
      expectedTdsAmount: expectedTds,
      actualTdsDeducted: actualTdsAmt,
      bankReceivedAmount: bankAmt,
      discrepancyAmount: Math.round(discrepancyAmount),
      matchStatus,
      matchConfidence: overallConfidence,
      matchType: bankMatchType === "EXACT" || tdsMatchType === "EXACT" ? "EXACT" : (hasBank || hasTds ? "FUZZY_ML" : "UNMATCHED"),
      discrepancyReasons,
      suggestedAction,
      reconciledAt: new Date(),
    });
  }

  // 3. Process remaining unlinked TDSRecords (Orphan 26AS entries)
  for (const t of tdsRecords) {
    if (usedTdsRecordIds.has(String(t._id))) continue;

    reconciliationResults.push({
      userId,
      financialYear: fy,
      invoiceId: null,
      invoiceNumber: "UNLINKED_26AS",
      incomeId: null,
      tdsRecordId: t._id,
      clientName: t.deductorName,
      invoiceAmount: t.creditAmount,
      expectedTdsAmount: t.tdsDeducted,
      actualTdsDeducted: t.tdsDeducted,
      bankReceivedAmount: 0,
      discrepancyAmount: t.creditAmount - t.tdsDeducted,
      matchStatus: "MISSING_PAYMENT",
      matchConfidence: 0.8,
      matchType: "UNMATCHED",
      discrepancyReasons: [
        `Form 26AS contains TDS credit of ₹${t.tdsDeducted.toLocaleString("en-IN")} on ₹${t.creditAmount.toLocaleString("en-IN")} from ${t.deductorName}, but no matching invoice or bank receipt was found.`,
      ],
      suggestedAction: `Create a retroactive invoice or link an unclassified bank deposit for ${t.deductorName} to claim this credit.`,
      reconciledAt: new Date(),
    });
  }

  // 4. Summarize statistics
  const statusCounts = {
    MATCHED: 0,
    PARTIAL_MATCH: 0,
    TDS_MISMATCH: 0,
    BANK_MISMATCH: 0,
    MISSING_TDS: 0,
    MISSING_PAYMENT: 0,
    DUPLICATE: 0,
    REVIEW_REQUIRED: 0,
    UNRESOLVED: 0,
  };

  let totalInvoiceAmount = 0;
  let totalExpectedTds = 0;
  let totalActualTds = 0;
  let totalBankReceived = 0;
  let totalDiscrepancy = 0;

  reconciliationResults.forEach((r) => {
    if (statusCounts[r.matchStatus] !== undefined) {
      statusCounts[r.matchStatus]++;
    }
    totalInvoiceAmount += r.invoiceAmount;
    totalExpectedTds += r.expectedTdsAmount;
    totalActualTds += r.actualTdsDeducted;
    totalBankReceived += r.bankReceivedAmount;
    totalDiscrepancy += r.discrepancyAmount;
  });

  return {
    financialYear: fy,
    totalInvoices: invoices.length,
    totalTdsRecords: tdsRecords.length,
    totalInvoiceAmount: Math.round(totalInvoiceAmount),
    totalExpectedTds: Math.round(totalExpectedTds),
    totalActualTds: Math.round(totalActualTds),
    totalBankReceived: Math.round(totalBankReceived),
    totalDiscrepancy: Math.round(totalDiscrepancy),
    statusCounts,
    reconciledItems: reconciliationResults,
  };
};

module.exports = {
  run3WayTDSReconciliation,
  calculateEntitySimilarity,
  normalizeEntityName,
};
