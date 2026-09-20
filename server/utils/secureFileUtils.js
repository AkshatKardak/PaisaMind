const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

/**
 * Sanitizes strings to strip sensitive Indian PII before logging
 * Masks: PAN numbers, Aadhaar numbers, Bank Account numbers, and Credit/Debit Cards
 */
const maskPII = (text) => {
  if (typeof text !== "string") return text;

  return text
    // Mask Credit/Debit Card: 16 digits (with or without dashes/spaces) e.g. 4111 2222 3333 4444 -> ****-****-****-4444
    .replace(/\b(?:\d{4}[-\s]?){3}(\d{4})\b/g, "****-****-****-$1")
    // Mask PAN: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F -> ABCDE****F)
    .replace(/\b([A-Z]{5})(\d{4})([A-Z])\b/gi, "$1****$3")
    // Mask Aadhaar: 12 digits, often formatted as 4-4-4 (e.g. 1234 5678 9012 -> ****-****-9012)
    .replace(/\b(\d{4})[\s\-]?(\d{4})[\s\-]?(\d{4})\b/g, "****-****-$3")
    // Mask Bank Account Numbers: 9 to 18 consecutive digits
    .replace(/\b(\d{2,4})(\d{5,12})(\d{3,4})\b/g, (match, prefix, middle, suffix) => {
      return `${prefix}${"*".repeat(middle.length)}${suffix}`;
    });
};

/**
 * Validates file buffer against statutory magic bytes to prevent extension spoofing
 */
const validateMagicBytes = (buffer, claimedExtension = "") => {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    return { isValid: false, detectedType: "unknown", error: "Empty or invalid buffer." };
  }

  const ext = String(claimedExtension).toLowerCase().replace(/^\./, "");

  // PDF: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
  if (
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return {
      isValid: ext === "pdf",
      detectedType: "pdf",
      error: ext !== "pdf" ? `File header indicates PDF, but extension claimed is .${ext}` : null,
    };
  }

  // XLSX / ZIP: PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    return {
      isValid: ["xlsx", "xls", "zip"].includes(ext),
      detectedType: "xlsx",
      error: !["xlsx", "xls", "zip"].includes(ext) ? `File header indicates Excel/ZIP, but extension claimed is .${ext}` : null,
    };
  }

  // PNG: \x89PNG\r\n\x1a\n
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return {
      isValid: ext === "png",
      detectedType: "png",
      error: ext !== "png" ? `File header indicates PNG, but extension claimed is .${ext}` : null,
    };
  }

  // JPEG: \xFF\xD8\xFF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return {
      isValid: ["jpg", "jpeg"].includes(ext),
      detectedType: "jpeg",
      error: !["jpg", "jpeg"].includes(ext) ? `File header indicates JPEG, but extension claimed is .${ext}` : null,
    };
  }

  // CSV: Text-based (no null bytes in first 1KB, valid UTF-8/ASCII chars)
  if (ext === "csv") {
    const sampleSize = Math.min(buffer.length, 1024);
    for (let i = 0; i < sampleSize; i++) {
      if (buffer[i] === 0x00) {
        return {
          isValid: false,
          detectedType: "binary",
          error: "CSV file contains null byte or binary data. Executable/binary files disguised as CSV are blocked.",
        };
      }
    }
    return { isValid: true, detectedType: "csv", error: null };
  }

  // If claimed to be PDF or Excel but failed magic bytes
  if (["pdf", "xlsx", "xls", "png", "jpg", "jpeg"].includes(ext)) {
    return {
      isValid: false,
      detectedType: "unknown_binary",
      error: `File signature does not match claimed file type .${ext}. Possible file spoofing attempt.`,
    };
  }

  return { isValid: true, detectedType: ext || "unknown", error: null };
};

/**
 * Creates a secure temporary file path with a random UUID
 */
const createSecureTempPath = (extension = ".tmp") => {
  const secureDir = path.join(os.tmpdir(), "paisamind_secure_uploads");
  if (!fs.existsSync(secureDir)) {
    fs.mkdirSync(secureDir, { recursive: true, mode: 0o700 }); // owner-only access
  }
  const fileUuid = crypto.randomUUID();
  return path.join(secureDir, `${fileUuid}${extension}`);
};

/**
 * Safely unlinks a file from disk, overwriting with zeroes if sensitive
 */
const safelyDeleteFile = async (filePath) => {
  if (!filePath || !fs.existsSync(filePath)) return;

  try {
    // Zero out file contents before unlinking to prevent memory/disk recovery
    const stat = fs.statSync(filePath);
    if (stat.isFile() && stat.size > 0) {
      const zeroBuffer = Buffer.alloc(Math.min(stat.size, 1024 * 1024));
      fs.writeFileSync(filePath, zeroBuffer);
    }
    fs.unlinkSync(filePath);
  } catch (err) {
    console.warn("[SecureFileUtils] File cleanup warning:", err.message);
  }
};

module.exports = {
  maskPII,
  validateMagicBytes,
  createSecureTempPath,
  safelyDeleteFile,
};
