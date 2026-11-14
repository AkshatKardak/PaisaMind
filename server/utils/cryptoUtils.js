const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16;

/**
 * Gets 32-byte encryption key from DATA_ENCRYPTION_KEY env var,
 * or derives a deterministic 32-byte key.
 */
function getEncryptionKey() {
  const envKey = process.env.DATA_ENCRYPTION_KEY;
  if (envKey) {
    if (Buffer.from(envKey, "base64").length === 32) {
      return Buffer.from(envKey, "base64");
    }
    if (Buffer.from(envKey, "hex").length === 32) {
      return Buffer.from(envKey, "hex");
    }
    // Hash key to ensure 32 bytes
    return crypto.createHash("sha256").update(envKey).digest();
  }
  // Deterministic fallback for dev/tests if DATA_ENCRYPTION_KEY is not supplied
  const fallbackSecret = process.env.JWT_SECRET || "paisamind-default-data-encryption-key-seed-32bytes!";
  return crypto.createHash("sha256").update(fallbackSecret).digest();
}

/**
 * Encrypts sensitive string (e.g. PAN) with AES-256-GCM
 * Returns string format: iv:ciphertext:tag (hex)
 */
function encryptData(plaintext) {
  if (!plaintext || typeof plaintext !== "string") return plaintext;
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${encrypted}:${tag.toString("hex")}`;
}

/**
 * Decrypts AES-256-GCM encrypted data
 */
function decryptData(ciphertext) {
  if (!ciphertext || typeof ciphertext !== "string" || !ciphertext.includes(":")) {
    return ciphertext;
  }
  try {
    const parts = ciphertext.split(":");
    if (parts.length !== 3) return ciphertext;

    const [ivHex, encHex, tagHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    return ciphertext;
  }
}

/**
 * Masks Indian PAN to last 4 characters:
 * e.g. ABCDE1234F -> XXXXXX234F or XXXXXX1234
 */
function maskPAN(pan) {
  if (!pan || typeof pan !== "string") return "XXXX";
  const clean = pan.trim().toUpperCase();
  if (clean.length < 4) return "XXXX";
  const lastFour = clean.slice(-4);
  const maskedPrefix = "X".repeat(Math.max(0, clean.length - 4));
  return `${maskedPrefix}${lastFour}`;
}

module.exports = {
  encryptData,
  decryptData,
  maskPAN,
  getEncryptionKey
};
