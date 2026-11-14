/**
 * Paste Parser Service
 * Regex-first bank alert, SMS, email, and UPI alert parser.
 * Supports Indian digit grouping (Lakhs/Crores), major Indian banks, and UPI templates.
 */

const BANK_PATTERNS = [
  { id: "hdfc", regex: /\b(hdfc|hdfcbank)\b/i },
  { id: "icici", regex: /\b(icici|icicibank)\b/i },
  { id: "sbi", regex: /\b(sbi|state bank)\b/i },
  { id: "axis", regex: /\b(axis|axisbank)\b/i },
  { id: "kotak", regex: /\b(kotak|kmb)\b/i },
  { id: "yesbank", regex: /\b(yes bank|yesbank)\b/i },
  { id: "idfc", regex: /\b(idfc|idfc first)\b/i },
  { id: "bob", regex: /\b(bob|bank of baroda)\b/i },
  { id: "paytm", regex: /\b(paytm)\b/i },
  { id: "phonepe", regex: /\b(phonepe)\b/i },
  { id: "gpay", regex: /\b(google pay|gpay)\b/i }
];

/**
 * Parse Indian formatted numbers:
 * 1,25,000 or 12,500.00 or 125000 or 1,25,000.50
 */
function extractAmount(text) {
  if (!text) return null;

  // Patterns with currency indicators
  // 1. Currency symbol/code before amount: Rs. 1,25,000.00 or INR 45,000 or ₹12,500
  const prefixRegex = /(?:(?:Rs\.?|INR|₹|INR\.)\s*)([0-9]{1,2}(?:,[0-9]{2})*,[0-9]{3}(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i;
  const prefixMatch = text.match(prefixRegex);
  if (prefixMatch && prefixMatch[1]) {
    const cleanStr = prefixMatch[1].replace(/,/g, "");
    const val = parseFloat(cleanStr);
    if (!isNaN(val) && val > 0) return Math.round(val * 100) / 100;
  }

  // 2. Amount followed by currency symbol/code: 1,25,000.00 Rs or 45000 INR
  const suffixRegex = /([0-9]{1,2}(?:,[0-9]{2})*,[0-9]{3}(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)\s*(?:Rs\.?|INR|₹)/i;
  const suffixMatch = text.match(suffixRegex);
  if (suffixMatch && suffixMatch[1]) {
    const cleanStr = suffixMatch[1].replace(/,/g, "");
    const val = parseFloat(cleanStr);
    if (!isNaN(val) && val > 0) return Math.round(val * 100) / 100;
  }

  // 3. Fallback: look for debited/credited by [amount]
  const contextRegex = /(?:debited|credited|paid|received|spent|transferred)(?:\s+(?:by|for|of|with))?\s+(?:(?:Rs\.?|INR|₹)\s*)?([0-9]{1,2}(?:,[0-9]{2})*,[0-9]{3}(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i;
  const contextMatch = text.match(contextRegex);
  if (contextMatch && contextMatch[1]) {
    const cleanStr = contextMatch[1].replace(/,/g, "");
    const val = parseFloat(cleanStr);
    if (!isNaN(val) && val > 0) return Math.round(val * 100) / 100;
  }

  return null;
}

/**
 * Extract direction (credit vs debit).
 * Returns 'credit' | 'debit' | null
 * NEVER guesses direction!
 */
function extractDirection(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  const creditMatch = /\b(credited|credit|received|deposited)\b|\bcr\b/i.test(lower);
  const debitMatch = /\b(debited|debit|spent|paid|withdrawn|transferred to)\b|\bdr\b/i.test(lower);

  if (creditMatch && !debitMatch) return "credit";
  if (debitMatch && !creditMatch) return "debit";

  // If both or neither match, check phrasing context
  if (creditMatch && debitMatch) {
    if (/\bcredited\b/i.test(lower) && !/\bdebited\b/i.test(lower)) return "credit";
    if (/\bdebited\b/i.test(lower) && !/\bcredited\b/i.test(lower)) return "debit";
  }

  return null;
}

/**
 * Parse date in formats: DD-MM-YY, DD-MM-YYYY, DD/MM/YYYY, DD/MM/YY, YYYY-MM-DD
 */
function extractDate(text) {
  if (!text) return new Date().toISOString().split("T")[0];

  // DD-MM-YYYY or DD-MM-YY or DD/MM/YYYY or DD/MM/YY
  const dateRegex = /\b([0-3]?[0-9])[\/\-]([0-1]?[0-9])[\/\-](20\d{2}|\d{2})\b/;
  const match = text.match(dateRegex);
  if (match) {
    let day = parseInt(match[1], 10);
    let month = parseInt(match[2], 10);
    let year = parseInt(match[3], 10);

    if (year < 100) {
      year = 2000 + year; // 26 -> 2026
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const mm = String(month).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      return `${year}-${mm}-${dd}`;
    }
  }

  // YYYY-MM-DD
  const isoRegex = /\b(20\d{2})-([0-1]\d)-([0-3]\d)\b/;
  const isoMatch = text.match(isoRegex);
  if (isoMatch) {
    return isoMatch[0];
  }

  // Standard current date fallback
  return new Date().toISOString().split("T")[0];
}

/**
 * Extract reference (UTR, UPI Ref, Txn ID)
 */
function extractReference(text) {
  if (!text) return null;

  // UPI/P2M/... or UPI/P2A/...
  const upiP2Match = text.match(/UPI\/(P2[MA])\/([0-9a-zA-Z]+)(?:\/([0-9a-zA-Z]+))?/i);
  if (upiP2Match) {
    return upiP2Match[0].trim();
  }

  // UPI Ref 123456789012 or UPI Ref No 123456789012
  const upiRefMatch = text.match(/(?:UPI\s*(?:Ref|Reference)(?:\s*No\.?)?|Ref\s*No\.?|UTR(?:\s*No\.?)?|Txn\s*ID)[:\s]+([A-Za-z0-9]+)/i);
  if (upiRefMatch && upiRefMatch[1]) {
    return upiRefMatch[1].trim();
  }

  // NEFT or IMPS mention
  if (/\bNEFT\b/i.test(text)) return "NEFT";
  if (/\bIMPS\b/i.test(text)) return "IMPS";
  if (/\bRTGS\b/i.test(text)) return "RTGS";

  return null;
}

/**
 * Extract counterparty name or service
 */
function extractCounterparty(text) {
  if (!text) return null;

  // from [COUNTERPARTY]
  const fromMatch = text.match(/\bfrom\s+([A-Z0-9\s\.\-_]+?)(?:\.|\s+UPI|\s+A\/c|\s+on\s|\s+Ref|\s*$)/i);
  if (fromMatch && fromMatch[1]) {
    const cp = fromMatch[1].trim();
    if (cp && !/^(your\s+a\/c|bank|account)$/i.test(cp)) {
      return cp;
    }
  }

  // to [COUNTERPARTY]
  const toMatch = text.match(/\bto\s+([A-Z0-9\s\.\-_]+?)(?:\.|\s+UPI|\s+A\/c|\s+on\s|\s+Ref|\s*$)/i);
  if (toMatch && toMatch[1]) {
    const cp = toMatch[1].trim();
    if (cp && !/^(your\s+a\/c|bank|account)$/i.test(cp)) {
      return cp;
    }
  }

  // UPI P2M counterparty (e.g., via UPI/P2M/5551234/PAYTM)
  const p2mMatch = text.match(/UPI\/P2M\/[^\/]+\/([A-Z0-9]+)/i);
  if (p2mMatch && p2mMatch[1]) {
    return p2mMatch[1].trim();
  }

  return null;
}

/**
 * Determine matched template
 */
function detectTemplate(text, direction) {
  const dirSuffix = direction ? `_${direction}` : "";

  if (/UPI\/P2M\//i.test(text)) return "upi_p2m";
  if (/UPI\/P2A\//i.test(text)) return "upi_p2a";

  for (const b of BANK_PATTERNS) {
    if (b.regex.test(text)) {
      return `${b.id}${dirSuffix}`;
    }
  }

  if (/NEFT/i.test(text)) return `neft${dirSuffix}`;
  if (/IMPS/i.test(text)) return `imps${dirSuffix}`;

  return `generic${dirSuffix || "_alert"}`;
}

/**
 * Optional LLM Fallback (Single message text, zero account numbers or batches).
 * Gated strictly behind LLM_FALLBACK_ENABLED === 'true'.
 */
async function callLlmFallbackIfEnabled(text) {
  if (process.env.LLM_FALLBACK_ENABLED !== "true" || !process.env.GROQ_API_KEY) {
    return null;
  }

  try {
    const Groq = require("groq-sdk");
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    // Mask any potential account numbers before sending
    const sanitizedText = text.replace(/XX\d{2,6}|\b\d{9,18}\b/gi, "XX****");

    const prompt = `Extract transaction details from this single Indian banking alert text.
Return ONLY valid JSON matching this schema with no markdown:
{
  "amount": number or null,
  "currency": "INR",
  "direction": "credit" or "debit" or null,
  "date": "YYYY-MM-DD" or null,
  "counterparty": string or null,
  "reference": string or null
}

Alert text:
${sanitizedText}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    return parsed;
  } catch (err) {
    return null;
  }
}

/**
 * Main parse function
 */
async function parseEntry(text, source = "manual") {
  if (typeof text !== "string" || !text.trim()) {
    return {
      amount: null,
      currency: "INR",
      direction: null,
      date: new Date().toISOString().split("T")[0],
      counterparty: null,
      reference: null,
      confidence: "low",
      matchedTemplate: "empty",
      raw: text || ""
    };
  }

  const raw = text.trim();
  let amount = extractAmount(raw);
  let direction = extractDirection(raw);
  let date = extractDate(raw);
  let reference = extractReference(raw);
  let counterparty = extractCounterparty(raw);
  let matchedTemplate = detectTemplate(raw, direction);

  // If regex failed on amount or direction, check LLM fallback if enabled
  if ((amount === null || direction === null) && process.env.LLM_FALLBACK_ENABLED === "true") {
    const llmResult = await callLlmFallbackIfEnabled(raw);
    if (llmResult) {
      if (amount === null && typeof llmResult.amount === "number") amount = llmResult.amount;
      if (direction === null && (llmResult.direction === "credit" || llmResult.direction === "debit")) {
        direction = llmResult.direction;
      }
      if (!counterparty && llmResult.counterparty) counterparty = llmResult.counterparty;
      if (!reference && llmResult.reference) reference = llmResult.reference;
    }
  }

  // Determine confidence
  // If amount or direction is missing -> LOW confidence (forces confirm UI, never guess direction!)
  let confidence = "low";
  if (amount !== null && direction !== null) {
    if (reference || counterparty || matchedTemplate.includes("upi") || matchedTemplate.includes("hdfc") || matchedTemplate.includes("icici") || matchedTemplate.includes("sbi")) {
      confidence = "high";
    } else {
      confidence = "medium";
    }
  }

  return {
    amount,
    currency: "INR",
    direction,
    date,
    counterparty,
    reference,
    confidence,
    matchedTemplate,
    raw
  };
}

module.exports = {
  parseEntry,
  extractAmount,
  extractDirection,
  extractDate,
  extractReference,
  extractCounterparty,
  detectTemplate
};
