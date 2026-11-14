/**
 * Client-Side Statement Parser
 * Implements Section 5.1:
 * Parses PDF bank statements entirely in the browser using pdfjs-dist.
 * Statement bytes never leave the device.
 * Supports HDFC, ICICI, SBI, Axis, Kotak.
 * Verifies running balance continuity: balance[i] = balance[i-1] + credit - debit.
 * Warns rather than silently accepting corrupted or tampered running balances.
 */

import * as pdfjsLib from "pdfjs-dist";

// Initialize worker src if in browser
if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "4.10.38"}/pdf.worker.min.mjs`;
}

/**
 * Parses raw text lines from PDF ArrayBuffer
 */
export async function extractTextFromPdfBuffer(arrayBuffer) {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  let fullText = "";

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    fullText += pageText + "\n";
  }

  return fullText;
}

/**
 * Detect bank identity from text
 */
export function detectBankFromText(text) {
  const lower = (text || "").toLowerCase();
  if (lower.includes("hdfc")) return "HDFC Bank";
  if (lower.includes("icici")) return "ICICI Bank";
  if (lower.includes("sbi") || lower.includes("state bank")) return "State Bank of India";
  if (lower.includes("axis")) return "Axis Bank";
  if (lower.includes("kotak")) return "Kotak Mahindra Bank";
  return "Standard Bank";
}

/**
 * Parses transactions from statement text with running balance continuity check
 */
export function parseStatementText(text) {
  const bankName = detectBankFromText(text);
  const transactions = [];
  const warnings = [];

  // Split lines
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Line pattern for bank statements:
  // Date (DD/MM/YYYY or DD-MM-YYYY) ... Narration ... Withdrawal ... Deposit ... Balance
  const rowRegex = /(\b[0-3]?[0-9][\/\-][0-1]?[0-9][\/\-](?:20\d{2}|\d{2})\b)\s+(.+?)\s+([0-9,]+(?:\.[0-9]{2})?)\s+([0-9,]+(?:\.[0-9]{2})?)\s+([0-9,]+(?:\.[0-9]{2})?)$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(rowRegex);
    if (match) {
      const dateStr = match[1];
      const desc = match[2].trim();
      const num1 = parseFloat(match[3].replace(/,/g, ""));
      const num2 = parseFloat(match[4].replace(/,/g, ""));
      const balance = parseFloat(match[5].replace(/,/g, ""));

      let withdrawal = 0;
      let deposit = 0;

      // Determine withdrawal vs deposit
      if (num1 > 0 && num2 === 0) {
        withdrawal = num1;
      } else if (num2 > 0 && num1 === 0) {
        deposit = num2;
      } else {
        // Assume first column withdrawal, second deposit
        withdrawal = num1;
        deposit = num2;
      }

      transactions.push({
        index: transactions.length,
        date: dateStr,
        description: desc,
        withdrawal,
        deposit,
        balance,
        rawLine: line
      });
    }
  }

  // Running balance continuity check:
  // balance[i] = balance[i-1] + deposit - withdrawal
  let hasBalanceMismatch = false;
  for (let i = 1; i < transactions.length; i++) {
    const prev = transactions[i - 1];
    const curr = transactions[i];

    const expectedBalance = Math.round((prev.balance + curr.deposit - curr.withdrawal) * 100) / 100;
    const actualBalance = Math.round(curr.balance * 100) / 100;

    // Tolerance of 1 INR for bank rounding
    if (Math.abs(expectedBalance - actualBalance) > 1.0) {
      hasBalanceMismatch = true;
      warnings.push(
        `Running balance mismatch at row ${i + 1}: expected ₹${expectedBalance.toLocaleString("en-IN")} based on previous balance ₹${prev.balance.toLocaleString("en-IN")}, but statement reports ₹${actualBalance.toLocaleString("en-IN")}.`
      );
    }
  }

  return {
    bankName,
    transactions,
    hasBalanceMismatch,
    warnings,
    summary: {
      totalCount: transactions.length,
      totalDeposit: transactions.reduce((s, t) => s + t.deposit, 0),
      totalWithdrawal: transactions.reduce((s, t) => s + t.withdrawal, 0)
    }
  };
}

/**
 * Main client-side parsing entrypoint:
 * Takes File object from browser file picker, extracts text, checks balance continuity.
 * File bytes NEVER leave the browser!
 */
export async function parsePdfStatementClientSide(file) {
  if (!file) throw new Error("No file provided");

  const arrayBuffer = await file.arrayBuffer();
  const text = await extractTextFromPdfBuffer(arrayBuffer);
  return parseStatementText(text);
}
