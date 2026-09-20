let pdfParse;
try {
  pdfParse = require("pdf-parse");
} catch (e) {}

let Groq;
try {
  Groq = require("groq-sdk");
} catch (e) {}

const { maskPII } = require("../utils/secureFileUtils");

const getGroqClient = () => {
  if (!Groq) return null;
  const key = process.env.GROQ_API_KEY;
  if (!key || key === "your_groq_api_key") return null;
  return new Groq({ apiKey: key });
};

/**
 * Standard Indian bank regex pattern for single line transaction:
 * Date + Narration/Description + Amount + [CR/DR]
 */
const TRANSACTION_LINE_REGEX = /^(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+(.+?)\s+([\d,]+\.?\d*)\s*(CR|DR)?$/i;

/**
 * Parses a page's text lines into structured candidate rows
 */
const parsePageLines = (text, pageNumber) => {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const rows = [];

  for (const line of lines) {
    const match = line.match(TRANSACTION_LINE_REGEX);
    if (match) {
      const rawDate = match[1];
      const desc = match[2];
      const amtStr = match[3];
      const crDr = match[4] || "";
      const isCredit =
        crDr.toUpperCase() === "CR" ||
        desc.toLowerCase().includes("cr") ||
        desc.toLowerCase().includes("deposit");

      rows.push({
        Date: rawDate,
        Description: desc,
        Debit: isCredit ? "" : amtStr,
        Credit: isCredit ? amtStr : "",
        Balance: "",
        sourcePage: pageNumber,
        extractionMethod: "pdf_table",
        extractionConfidence: 0.92,
      });
    }
  }

  return rows;
};

/**
 * Fallback LLM table extractor for unstructured text on a specific page (WITHOUT truncation)
 */
const parsePageWithLLM = async (pageText, pageNumber) => {
  const groq = getGroqClient();
  if (!groq || !pageText || pageText.trim().length < 30) return [];

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a bank statement parsing engine. Extract all bank transactions into a strict JSON array of objects with keys: Date, Description, Debit, Credit, Balance. Return ONLY the JSON array without markdown wrappers.",
        },
        {
          role: "user",
          content: `Extract all transaction rows from this bank statement page text:\n\n${pageText}`,
        },
      ],
      temperature: 0.1,
    });

    const raw = response.choices?.[0]?.message?.content?.trim() || "";
    const cleaned = raw.replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        ...item,
        sourcePage: pageNumber,
        extractionMethod: "llm_text_page",
        extractionConfidence: 0.88,
      }));
    }
  } catch (err) {
    // LLM page fallback error handled quietly
  }

  return [];
};

const crypto = require("crypto");

/**
 * Extracts transactions page-by-page from a PDF buffer without arbitrary character slicing
 */
const extractPdfPagesStreaming = async (pdfBuffer, documentId = crypto.randomUUID()) => {
  if (!pdfParse) {
    throw new Error("PDF parsing module is not available. Please upload CSV or Excel statement.");
  }

  const pages = [];

  // Capture page-by-page text via pdf-parse render hook
  const options = {
    pagerender: async (pageData) => {
      const textContent = await pageData.getTextContent();
      let lastY, text = "";
      for (const item of textContent.items) {
        if (lastY === item.transform[5] || !lastY) {
          text += item.str + " ";
        } else {
          text += "\n" + item.str + " ";
        }
        lastY = item.transform[5];
      }
      pages.push({
        pageNumber: pageData.pageIndex + 1,
        text: text.trim(),
      });
      return text;
    },
  };

  await pdfParse(pdfBuffer, options);

  const allRows = [];
  let scannedPagesCount = 0;
  let processedPages = 0;
  let failedPages = 0;
  let rejectedCount = 0;
  let reviewRequiredCount = 0;

  for (const page of pages) {
    try {
      const pageText = page.text || "";

      // If page has virtually no selectable text, note it as scanned
      if (pageText.length < 25) {
        scannedPagesCount++;
        continue;
      }

      // 1. Try standard regex pattern matching for table rows
      let pageRows = parsePageLines(pageText, page.pageNumber);

      // 2. If regex finds 0 rows but page has substantial text, use LLM page parser
      if (pageRows.length === 0 && pageText.length >= 60) {
        pageRows = await parsePageWithLLM(pageText, page.pageNumber);
      }

      const validatedRows = [];
      for (const r of pageRows) {
        // Validate date or amount presence
        if (!r.Date && !r.Debit && !r.Credit && !r.Amount) {
          rejectedCount++;
          continue;
        }

        const confidence = r.extractionConfidence || 0.90;
        if (confidence < 0.7) {
          reviewRequiredCount++;
        }

        validatedRows.push({
          ...r,
          documentId,
          sourcePage: page.pageNumber,
          extractionMethod: r.extractionMethod || "pdf_stream_page",
          extractionConfidence: confidence,
        });
      }

      allRows.push(...validatedRows);
      processedPages++;
    } catch (pageErr) {
      failedPages++;
    }
  }

  return {
    rows: allRows,
    documentId,
    totalPages: pages.length,
    processedPages,
    failedPages,
    scannedPagesCount,
    extractedCount: allRows.length,
    rejectedCount,
    reviewRequiredCount,
  };
};

module.exports = {
  extractPdfPagesStreaming,
  parsePageLines,
  parsePageWithLLM,
};
