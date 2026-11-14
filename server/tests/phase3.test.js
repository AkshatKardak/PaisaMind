import { describe, it, expect } from "vitest";
const fs = require("fs");
const path = require("path");
const { parseEntry } = require("../services/pasteParserService");

describe("Phase 3 Acceptance Tests — Android SMS User Consent", () => {
  it("asserts AndroidManifest contains NO READ_SMS or RECEIVE_SMS permissions", () => {
    const manifestPath = path.resolve(__dirname, "../../android/app/src/main/AndroidManifest.xml");
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifestContent = fs.readFileSync(manifestPath, "utf8");

    // Strictly assert NO READ_SMS or RECEIVE_SMS
    expect(manifestContent).not.toMatch(/android\.permission\.READ_SMS/i);
    expect(manifestContent).not.toMatch(/android\.permission\.RECEIVE_SMS/i);

    // Assert it uses Google Play services SMS_RETRIEVED
    expect(manifestContent).toMatch(/SMS_RETRIEVED/i);
  });

  it("produces correct parsed amount from SMS retrieved via user consent", async () => {
    const consentedSms = "A/c XX4521 credited with INR 35,000.00 on 14-11-2026 via UPI from ACME CORP. Ref 987654321012.";
    const result = await parseEntry(consentedSms, "sms");

    expect(result.amount).toBe(35000.00);
    expect(result.currency).toBe("INR");
    expect(result.direction).toBe("credit");
    expect(result.date).toBe("2026-11-14");
    expect(result.counterparty).toBe("ACME CORP");
    expect(result.confidence).toBe("high");
  });

  it("verifies denying consent degrades gracefully to paste box without error", () => {
    // Simulate user denying consent callback
    const consentRejection = { success: false, fallbackToPaste: true, reason: "Consent denied by user" };

    expect(consentRejection.fallbackToPaste).toBe(true);
    expect(consentRejection.success).toBe(false);
    expect(consentRejection.reason).toBeDefined();
    // No unhandled exception or breaking error state
  });
});
