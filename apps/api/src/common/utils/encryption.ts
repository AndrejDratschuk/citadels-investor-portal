/**
 * Encryption Utility
 * AES-256-GCM encryption for secure credential storage
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Get encryption key from environment variable
 * Key should be 32 bytes (256 bits) hex-encoded
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  
  if (!keyHex) {
    // Generate a warning in development, throw in production
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY environment variable is required in production');
    }
    // Development fallback - NOT SECURE, only for local dev
    console.warn('WARNING: Using fallback encryption key. Set ENCRYPTION_KEY in production.');
    return crypto.scryptSync('dev-fallback-key', 'dev-salt', 32);
  }

  // Key should be 64 hex chars = 32 bytes
  if (keyHex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }

  return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypt plaintext using AES-256-GCM
 * Returns: salt:iv:authTag:ciphertext (all hex-encoded, colon-separated)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  // Derive a unique key for this encryption using the salt
  const derivedKey = crypto.scryptSync(key, salt, 32);
  
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: salt:iv:authTag:ciphertext
  return [
    salt.toString('hex'),
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted,
  ].join(':');
}

/**
 * Decrypt ciphertext encrypted with AES-256-GCM
 * Input format: salt:iv:authTag:ciphertext (all hex-encoded)
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();
  
  const parts = encryptedData.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format');
  }
  
  const [saltHex, ivHex, authTagHex, ciphertext] = parts;
  
  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  // Derive the same key using the salt
  const derivedKey = crypto.scryptSync(key, salt, 32);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Generate a new encryption key (for initial setup)
 * Returns a 64-character hex string suitable for ENCRYPTION_KEY env var
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Check if a string appears to be encrypted (vs base64 legacy format)
 */
export function isEncrypted(data: string): boolean {
  // New format has 4 colon-separated parts
  const parts = data.split(':');
  return parts.length === 4 && parts.every(p => /^[0-9a-f]+$/i.test(p));
}

/**
 * Migrate legacy base64 credentials to encrypted format
 */
export function migrateFromBase64(base64Data: string): string {
  try {
    const decoded = Buffer.from(base64Data, 'base64').toString('utf8');
    // Verify it's valid JSON before re-encrypting
    JSON.parse(decoded);
    return encrypt(decoded);
  } catch {
    throw new Error('Invalid legacy credential format');
  }
}











