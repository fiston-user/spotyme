import crypto from "crypto";

// Encryption configuration
const algorithm = "aes-256-gcm";
const ivLength = 16;
const saltLength = 64;
const tagLength = 16;
const iterations = 100000;
const keyLength = 32;

// Get encryption key from environment or generate a secure one
const getEncryptionKey = (): string => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    console.error("WARNING: ENCRYPTION_KEY not set in environment variables");
    console.error("Using a temporary key - this is not secure for production!");
    return crypto.randomBytes(32).toString("hex");
  }
  return key;
};

// Derive key from password using PBKDF2
const deriveKey = (password: string, salt: Buffer): Buffer => {
  return crypto.pbkdf2Sync(password, salt, iterations, keyLength, "sha256");
};

export const encrypt = (text: string): string => {
  try {
    const password = getEncryptionKey();
    const salt = crypto.randomBytes(saltLength);
    const key = deriveKey(password, salt);
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    const encrypted = Buffer.concat([
      cipher.update(text, "utf8"),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    // Combine salt, iv, tag, and encrypted data
    const combined = Buffer.concat([salt, iv, tag, encrypted]);

    return combined.toString("base64");
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
};

export const decrypt = (encryptedData: string): string => {
  try {
    const password = getEncryptionKey();
    const combined = Buffer.from(encryptedData, "base64");

    // Extract components
    const salt = combined.slice(0, saltLength);
    const iv = combined.slice(saltLength, saltLength + ivLength);
    const tag = combined.slice(
      saltLength + ivLength,
      saltLength + ivLength + tagLength
    );
    const encrypted = combined.slice(saltLength + ivLength + tagLength);

    const key = deriveKey(password, salt);
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
};

// Hash sensitive data for comparison (e.g., API keys)
export const hashData = (data: string): string => {
  return crypto.createHash("sha256").update(data).digest("hex");
};

// Generate secure random tokens
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString("hex");
};

// Validate encryption key strength
export const validateEncryptionKey = (key: string): boolean => {
  // Key should be at least 32 characters and contain various character types
  if (key.length < 32) return false;

  const hasUpperCase = /[A-Z]/.test(key);
  const hasLowerCase = /[a-z]/.test(key);
  const hasNumbers = /\d/.test(key);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(key);

  return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
};
