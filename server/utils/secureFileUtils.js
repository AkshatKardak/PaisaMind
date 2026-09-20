const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

/**
 * Sanitizes strings to strip sensitive Indian PII before logging
 * Masks: PAN numbers, Aadhaar numbers, and Bank Account numbers
 */
const maskPII = (text) => {
  if (typeof text !== "string") return text;

  return text
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
  createSecureTempPath,
  safelyDeleteFile,
};
