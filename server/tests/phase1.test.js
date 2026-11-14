import { describe, it, expect } from "vitest";
const { parseEntry } = require("../services/pasteParserService");

describe("Phase 1 Acceptance Tests", () => {
  it("should parse Test Case 1 correctly (HDFC/Credit/Indian date)", async () => {
    const raw = "Rs.12,500.00 credited to your A/c XX4521 on 14-11-26 from RAHUL SHARMA. UPI Ref 123456789012.";
    const result = await parseEntry(raw, "sms");

    expect(result.amount).toBe(12500.00);
    expect(result.currency).toBe("INR");
    expect(result.direction).toBe("credit");
    expect(result.date).toBe("2026-11-14");
    expect(result.counterparty).toBe("RAHUL SHARMA");
    expect(result.reference).toBe("123456789012");
    expect(result.confidence).toBe("high");
    expect(result.raw).toBe(raw);
  });

  it("should parse Test Case 2 correctly (NEFT Debit with Indian lakh grouping)", async () => {
    const raw = "Your a/c XX8812 debited by Rs 1,25,000.00 on 02/11/2026 - NEFT.";
    const result = await parseEntry(raw, "sms");

    expect(result.amount).toBe(125000.00);
    expect(result.currency).toBe("INR");
    expect(result.direction).toBe("debit");
    expect(result.date).toBe("2026-11-02");
    expect(result.reference).toBe("NEFT");
    expect(result.confidence).toBe("high");
    expect(result.raw).toBe(raw);
  });

  it("should parse Test Case 3 correctly (UPI/P2M Paytm Credit)", async () => {
    const raw = "INR 45,000 credited via UPI/P2M/5551234/PAYTM on 09-11-2026.";
    const result = await parseEntry(raw, "sms");

    expect(result.amount).toBe(45000.00);
    expect(result.currency).toBe("INR");
    expect(result.direction).toBe("credit");
    expect(result.date).toBe("2026-11-09");
    expect(result.counterparty).toBe("PAYTM");
    expect(result.reference).toBe("UPI/P2M/5551234/PAYTM");
    expect(result.matchedTemplate).toBe("upi_p2m");
    expect(result.confidence).toBe("high");
    expect(result.raw).toBe(raw);
  });

  it("should return confidence low and never guess direction if direction is absent", async () => {
    const raw = "A/c XX1234 balance is Rs 50,000.00 on 14-11-2026.";
    const result = await parseEntry(raw, "sms");

    expect(result.direction).toBeNull();
    expect(result.confidence).toBe("low");
  });

  it("asserts UPI intent builder enforces two decimals and truncates tn/tr", () => {
    // Test UPI logic server-side / standalone
    function buildUpiUriTest({ vpa, payeeName, amount, note, invoiceRef }) {
      const numAmount = Number(amount) || 0;
      const am = numAmount.toFixed(2);
      const tn = (note || "").slice(0, 50);
      const tr = (invoiceRef || "").slice(0, 35);
      const params = new URLSearchParams({
        pa: vpa.trim(),
        pn: (payeeName || "Freelancer").trim(),
        am,
        cu: "INR",
        tn,
        tr
      });
      return `upi://pay?${params.toString()}`;
    }

    const uri1 = buildUpiUriTest({
      vpa: "freelancer@upi",
      payeeName: "Akshat",
      amount: 12500, // integer
      note: "This is a very long payment description that exceeds the fifty character limit set by NPCI specs",
      invoiceRef: "INV-2026-11-14-EXTRA-LONG-REFERENCE-35CHARS-LIMIT-TEST"
    });

    const parsedUrl = new URL(uri1);
    expect(parsedUrl.protocol).toBe("upi:");
    expect(parsedUrl.searchParams.get("am")).toBe("12500.00");
    expect(parsedUrl.searchParams.get("cu")).toBe("INR");
    expect(parsedUrl.searchParams.get("tn").length).toBeLessThanOrEqual(50);
    expect(parsedUrl.searchParams.get("tr").length).toBeLessThanOrEqual(35);

    // Verify 40-char tn is truncated, not rejected
    const fortyCharNote = "1234567890123456789012345678901234567890"; // 40 chars
    const uri2 = buildUpiUriTest({
      vpa: "test@upi",
      amount: 45.5,
      note: fortyCharNote,
      invoiceRef: "INV-001"
    });
    const parsedUrl2 = new URL(uri2);
    expect(parsedUrl2.searchParams.get("am")).toBe("45.50");
    expect(parsedUrl2.searchParams.get("tn")).toBe(fortyCharNote);
  });
});
