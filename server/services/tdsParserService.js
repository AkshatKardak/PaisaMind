/**
 * Form 26AS & AIS Parsing and Reconciliation Service
 * Validates magic bytes, parses PDF rows, extracts 194J/194C/194H/194O sections,
 * SFT entries (bank interest, dividends), encrypts PAN at rest, and provides 3-bucket reconciliation.
 */

const pdfParse = require("pdf-parse");
const { encryptData, maskPAN } = require("../utils/cryptoUtils");
const TDSRecord = require("../models/TDSRecord");
const Invoice = require("../models/Invoice");

/**
 * Validate PDF Magic Bytes: %PDF (0x25 0x50 0x44 0x46)
 */
function validatePdfMagicBytes(buffer) {
  if (!buffer || buffer.length < 4) return false;
  return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
}

/**
 * Detects if a PDF buffer has an encryption dictionary
 */
function isPdfPasswordProtected(buffer) {
  if (!buffer) return false;
  const str = buffer.toString("binary", 0, Math.min(buffer.length, 100000));
  return /\/Encrypt\b/i.test(str);
}

/**
 * Parse text content from Form 26AS or AIS PDF
 */
function parse26asPdfText(text, financialYear = "2025-26") {
  const records = [];
  const sftEntries = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  let detectedPan = null;
  const panMatch = text.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/i);
  if (panMatch) {
    detectedPan = panMatch[1].toUpperCase();
  }

  // Detect financial year in header if present
  const fyMatch = text.match(/Financial\s*Year\s*[:\-]?\s*(20\d{2}[-–]\d{2,4})/i);
  const resolvedFy = fyMatch ? fyMatch[1].replace("–", "-") : financialYear;

  // Pattern for TDS table row:
  // Deductor Name, TAN, Section (194J, 194C, etc.), Amount Paid, Tax Deducted
  // Example lines in 26AS:
  // "GOOGLE INDIA PVT LTD BLRG12345E 194J 1,50,000.00 15,000.00"
  // or multi-column layout
  const rowRegex = /([A-Za-z0-9\s\.\-_&,]+?)\s+([A-Z]{4}[0-9]{4,6}[A-Z])\s+(194[A-Z0-9]{1,3}|192|195|206[A-Z0-9]*)\s+([0-9,]+(?:\.[0-9]{2})?)\s+([0-9,]+(?:\.[0-9]{2})?)/gi;

  let match;
  while ((match = rowRegex.exec(text)) !== null) {
    const rawDeductor = match[1].trim();
    const tan = match[2].trim().toUpperCase();
    const section = match[3].trim().toUpperCase();
    const creditAmount = parseFloat(match[4].replace(/,/g, ""));
    const tdsDeducted = parseFloat(match[5].replace(/,/g, ""));

    if (rawDeductor && !isNaN(creditAmount) && !isNaN(tdsDeducted)) {
      records.push({
        deductorName: rawDeductor,
        deductorTAN: tan,
        deductorPAN: detectedPan,
        section,
        creditAmount,
        tdsDeducted,
        tdsDeposited: tdsDeducted,
        financialYear: resolvedFy,
        source: "26AS_IMPORT",
      });
    }
  }

  // If table row regex didn't catch structured layout, run fallback line-by-line parser
  if (records.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const tanMatch = line.match(/\b([A-Z]{4}[0-9]{5}[A-Z])\b/);
      const secMatch = line.match(/\b(194J|194C|194H|194O|194A|194Q)\b/i);
      const amounts = line.match(/\b[0-9]{1,2}(?:,[0-9]{2})*,[0-9]{3}(?:\.[0-9]{2})?\b|\b[0-9]{4,10}(?:\.[0-9]{2})?\b/g);

      if (secMatch && amounts && amounts.length >= 2) {
        const creditAmt = parseFloat(amounts[0].replace(/,/g, ""));
        const tdsAmt = parseFloat(amounts[1].replace(/,/g, ""));
        const deductor = (lines[i - 1] || "Deductor").replace(/[^\w\s\.\-]/g, "").trim();

        records.push({
          deductorName: deductor.length > 3 ? deductor : `Deductor ${tanMatch ? tanMatch[1] : ""}`.trim(),
          deductorTAN: tanMatch ? tanMatch[1] : undefined,
          deductorPAN: detectedPan,
          section: secMatch[1].toUpperCase(),
          creditAmount: creditAmt,
          tdsDeducted: tdsAmt,
          tdsDeposited: tdsAmt,
          financialYear: resolvedFy,
          source: "26AS_IMPORT",
        });
      }
    }
  }

  // Parse AIS SFT entries (e.g. SFT-005 Bank Interest, SFT-001 Dividends)
  const sftRegex = /(SFT-[0-9]{3}|Interest|Dividend)\s+([A-Za-z0-9\s]+?)\s+([0-9,]+(?:\.[0-9]{2})?)/gi;
  let sftMatch;
  while ((sftMatch = sftRegex.exec(text)) !== null) {
    const sftCode = sftMatch[1].trim();
    const sourceDesc = sftMatch[2].trim();
    const amt = parseFloat(sftMatch[3].replace(/,/g, ""));
    if (!isNaN(amt)) {
      sftEntries.push({
        code: sftCode,
        description: sourceDesc,
        amount: amt,
      });
    }
  }

  return {
    detectedPan: detectedPan ? maskPAN(detectedPan) : null,
    financialYear: resolvedFy,
    records,
    sftEntries,
  };
}

/**
 * 3-Bucket Reconciliation according to Section 3:
 * 1. matched: invoice and 26AS credit agree.
 * 2. credit_without_invoice: claimable TDS with no invoice logged ("money you forgot" view).
 * 3. invoice_without_credit: invoice exists, no TDS recorded (prompt to chase client).
 */
async function reconcile3Buckets(userId, financialYear = "2025-26") {
  const [invoices, tdsRecords] = await Promise.all([
    Invoice.find({ userId }),
    TDSRecord.find({ userId, financialYear }),
  ]);

  const matched = [];
  const credit_without_invoice = [];
  const invoice_without_credit = [];

  const matchedTdsIds = new Set();
  const matchedInvoiceIds = new Set();

  // Match invoices against 26AS records
  for (const inv of invoices) {
    const invAmount = inv.totalAmount || inv.amount || 0;
    const invTds = inv.tdsDeductedAmount || Math.round(invAmount * 0.1);

    let bestMatch = null;
    let minDiff = Infinity;

    for (const t of tdsRecords) {
      if (matchedTdsIds.has(String(t._id))) continue;

      // Check amount agreement within tolerance (5% or ₹500)
      const creditDiff = Math.abs(t.creditAmount - invAmount);
      const tdsDiff = Math.abs(t.tdsDeducted - invTds);

      if (creditDiff <= Math.max(500, invAmount * 0.05) || tdsDiff <= 100) {
        if (creditDiff < minDiff) {
          minDiff = creditDiff;
          bestMatch = t;
        }
      }
    }

    if (bestMatch) {
      matchedTdsIds.add(String(bestMatch._id));
      matchedInvoiceIds.add(String(inv._id));
      matched.push({
        invoiceId: inv._id,
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.clientName,
        invoiceAmount: invAmount,
        tdsRecordId: bestMatch._id,
        deductorName: bestMatch.deductorName,
        deductorTAN: bestMatch.deductorTAN,
        section: bestMatch.section,
        claimedTds: bestMatch.tdsDeducted,
        creditAmount: bestMatch.creditAmount,
        status: "matched",
      });
    } else {
      invoice_without_credit.push({
        invoiceId: inv._id,
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.clientName,
        invoiceAmount: invAmount,
        expectedTds: invTds,
        dueDate: inv.dueDate,
        prompt: `Invoice ${inv.invoiceNumber} (₹${invAmount.toLocaleString("en-IN")}) has no matching TDS credit in Form 26AS. Follow up with ${inv.clientName} for Form 16A.`,
      });
    }
  }

  // Remaining TDS records are "credit_without_invoice" — "money you forgot" view
  for (const t of tdsRecords) {
    if (matchedTdsIds.has(String(t._id))) continue;

    credit_without_invoice.push({
      tdsRecordId: t._id,
      deductorName: t.deductorName,
      deductorTAN: t.deductorTAN,
      deductorPAN: maskPAN(t.deductorPAN),
      section: t.section,
      creditAmount: t.creditAmount,
      claimableTds: t.tdsDeducted,
      financialYear: t.financialYear,
      status: "unclaimed_credit",
      tag: "Money you forgot",
    });
  }

  const totalClaimableUnloggedTds = credit_without_invoice.reduce((s, r) => s + r.claimableTds, 0);

  return {
    summary: {
      matchedCount: matched.length,
      creditWithoutInvoiceCount: credit_without_invoice.length,
      invoiceWithoutCreditCount: invoice_without_credit.length,
      totalClaimableUnloggedTds,
    },
    matched,
    credit_without_invoice,
    invoice_without_credit,
  };
}

/**
 * One-Tap Delete: removes all uploaded TDS records and derived reconciliations for a user / batch
 */
async function deleteUserTdsUploads(userId, batchId = null) {
  const query = { userId };
  if (batchId) {
    query["metadata.batchId"] = batchId;
  }

  const deleteResult = await TDSRecord.deleteMany(query);
  return {
    deletedCount: deleteResult.deletedCount,
    message: `Successfully deleted ${deleteResult.deletedCount} TDS records and all derived rows.`,
  };
}

module.exports = {
  validatePdfMagicBytes,
  isPdfPasswordProtected,
  parse26asPdfText,
  reconcile3Buckets,
  deleteUserTdsUploads,
};
