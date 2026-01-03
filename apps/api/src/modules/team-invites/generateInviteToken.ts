import { randomBytes } from 'crypto';

/**
 * Pure function to generate a cryptographically secure invite token
 * Token length: 64 characters (32 bytes as hex)
 */
export function generateInviteToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Pure function to calculate token expiry date
 * Determinism: receives timestamp as parameter
 */
export function calculateTokenExpiry(timestamp: Date, days: number = 7): Date {
  const expiry = new Date(timestamp);
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}

/**
 * Pure function to generate a URL-friendly slug from a fund name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

