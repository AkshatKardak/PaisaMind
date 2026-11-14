/**
 * UPI URI & QR Code Utility
 * Generates intent link conforming strictly to NPCI UPI Specifications:
 * upi://pay?pa=<vpa>&pn=<payeeName>&am=<amount>&cu=INR&tn=<note>&tr=<invoiceRef>
 */

import QRCode from "qrcode";

/**
 * Builds standard UPI intent URI
 * @param {Object} params
 * @param {string} params.vpa - Payee VPA / UPI ID
 * @param {string} [params.payeeName] - Payee name
 * @param {number|string} params.amount - Amount in INR (will be formatted to 2 decimals)
 * @param {string} [params.note] - Payment note (truncated to max 50 characters)
 * @param {string} [params.invoiceRef] - Invoice reference (truncated to max 35 characters)
 * @returns {string} Fully encoded upi:// intent URI
 */
export function buildUpiUri({ vpa, payeeName, amount, note, invoiceRef }) {
  if (!vpa || typeof vpa !== "string" || !vpa.trim()) {
    throw new Error("Valid payee VPA (UPI ID) is required.");
  }

  const cleanVpa = vpa.trim();
  const cleanName = (payeeName || "Merchant").trim();
  
  // Amount must always be formatted to exactly 2 decimals
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < 0) {
    throw new Error("Amount must be a valid positive number.");
  }
  const am = numAmount.toFixed(2);

  // Note (tn) max 50 chars, truncated not rejected
  const cleanNote = (note || "Invoice payment").trim().slice(0, 50);

  // Reference (tr) max 35 chars, truncated not rejected
  const cleanRef = (invoiceRef || `INV-${Date.now()}`).trim().slice(0, 35);

  const params = new URLSearchParams();
  params.set("pa", cleanVpa);
  params.set("pn", cleanName);
  params.set("am", am);
  params.set("cu", "INR");
  params.set("tn", cleanNote);
  params.set("tr", cleanRef);

  return `upi://pay?${params.toString()}`;
}

/**
 * Generates a Data URL QR Code image client-side using `qrcode` library.
 * Zero server round trip, zero external API.
 * @param {string} text - Content to encode (e.g. upiUri)
 * @param {Object} [options]
 * @returns {Promise<string>} base64 Data URL
 */
export async function generateClientQrDataUrl(text, options = {}) {
  try {
    return await QRCode.toDataURL(text, {
      width: options.width || 280,
      margin: options.margin || 2,
      color: {
        dark: options.darkColor || "#09090b",
        light: options.lightColor || "#ffffff"
      },
      errorCorrectionLevel: "M"
    });
  } catch (err) {
    console.error("QR Code Generation Error:", err);
    throw err;
  }
}
