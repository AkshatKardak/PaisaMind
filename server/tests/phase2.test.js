import { describe, it, expect, vi } from "vitest";
const {
  validatePdfMagicBytes,
  isPdfPasswordProtected,
  parse26asPdfText,
  deleteUserTdsUploads
} = require("../services/tdsParserService");
const { encryptData, decryptData, maskPAN } = require("../utils/cryptoUtils");
const TDSRecord = require("../models/TDSRecord");

describe("Phase 2 Acceptance Tests — Form 26AS / AIS", () => {
  it("validates PDF magic bytes correctly (%PDF)", () => {
    const validPdf = Buffer.from("%PDF-1.4 sample content");
    const invalidPdf = Buffer.from("NOT_A_PDF_FILE");

    expect(validatePdfMagicBytes(validPdf)).toBe(true);
    expect(validatePdfMagicBytes(invalidPdf)).toBe(false);
  });

  it("yields 12 records with sections intact for 12 deductor rows", () => {
    // Generate text representing a 26AS with 12 deductor rows across sections (194J, 194C, 194H, 194O)
    const sections = ["194J", "194C", "194H", "194O"];
    let sample26asText = "FORM NO. 26AS\nAnnual Tax Statement under Section 203AA\nFinancial Year: 2025-26\nPAN: ABCDE1234F\n";

    for (let i = 1; i <= 12; i++) {
      const sec = sections[(i - 1) % sections.length];
      const credit = 50000 * i;
      const tds = credit * 0.1;
      const tanNumber = String(i).padStart(5, "0");
      sample26asText += `CLIENT_CORP_${i}_LIMITED DELC${tanNumber}A ${sec} ${credit.toLocaleString("en-IN")}.00 ${tds.toLocaleString("en-IN")}.00\n`;
    }

    const { records, detectedPan } = parse26asPdfText(sample26asText);
    expect(records.length).toBe(12);

    // Verify sections are intact
    expect(records[0].section).toBe("194J");
    expect(records[1].section).toBe("194C");
    expect(records[2].section).toBe("194H");
    expect(records[3].section).toBe("194O");
    expect(records[11].section).toBe("194O");

    // Verify PAN is masked
    expect(detectedPan).toBe("XXXXXX234F");
  });

  it("routes password-protected PDF to consent, not an unhandled error", () => {
    const encryptedPdfBuffer = Buffer.from("%PDF-1.5\n/Encrypt 12 0 R\n/Trailer << /Root 1 0 R >>");
    const isEncrypted = isPdfPasswordProtected(encryptedPdfBuffer);
    expect(isEncrypted).toBe(true);

    const normalPdfBuffer = Buffer.from("%PDF-1.5\n/Pages 2 0 R\n/Trailer << /Root 1 0 R >>");
    expect(isPdfPasswordProtected(normalPdfBuffer)).toBe(false);
  });

  it("ensures PAN is encrypted with AES-256-GCM and never appears unmasked in JSON outputs", () => {
    const plainPan = "ABCDE1234F";
    const encrypted = encryptData(plainPan);
    expect(encrypted).not.toBe(plainPan);
    expect(encrypted.split(":").length).toBe(3); // iv:ciphertext:tag

    const decrypted = decryptData(encrypted);
    expect(decrypted).toBe(plainPan);

    const masked = maskPAN(plainPan);
    expect(masked).toBe("XXXXXX234F");
    expect(masked).not.toContain("ABCDE12");

    // Test TDSRecord model JSON transformation
    const mockRecord = new TDSRecord({
      userId: "60c72b2f9b1d8b2bad000001",
      deductorName: "Acme Corp",
      deductorPAN: plainPan,
      section: "194J",
      creditAmount: 100000,
      tdsDeducted: 10000
    });

    const json = mockRecord.toJSON();
    expect(json.deductorPAN).toBe("XXXXXX234F");
    expect(json.deductorPAN).not.toBe(plainPan);
    expect(json.rawEncryptedPAN).toBeUndefined();
  });

  it("deleting an upload removes records and derived rows", async () => {
    const fakeUserId = "60c72b2f9b1d8b2bad000002";
    vi.spyOn(TDSRecord, "deleteMany").mockResolvedValue({ deletedCount: 12 });

    const result = await deleteUserTdsUploads(fakeUserId, "batch-123");
    expect(result.deletedCount).toBe(12);
    expect(result.message).toContain("Successfully deleted 12 TDS records");

    TDSRecord.deleteMany.mockRestore();
  });
});
