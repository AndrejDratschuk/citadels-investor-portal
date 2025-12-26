import { randomInt } from 'crypto';
import { supabaseAdmin } from '../../common/database/supabase';

/**
 * Verification code expiration time in minutes
 */
const CODE_EXPIRY_MINUTES = 10;

/**
 * Maximum verification attempts allowed
 */
const MAX_ATTEMPTS = 3;

/**
 * Generate a 6-digit verification code
 */
export function generateVerificationCode(): string {
  return randomInt(100000, 999999).toString();
}

/**
 * Calculate code expiration date
 */
export function calculateCodeExpiry(timestamp: Date, minutes: number = CODE_EXPIRY_MINUTES): Date {
  const expiry = new Date(timestamp);
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry;
}

/**
 * Create a new verification code for an email
 */
export async function createVerificationCode(
  email: string,
  purpose: 'account_creation' | 'password_reset' | 'login',
  timestamp: Date
): Promise<{ code: string; expiresIn: number }> {
  // Invalidate any existing codes for this email and purpose
  await supabaseAdmin
    .from('email_verification_codes')
    .delete()
    .eq('email', email)
    .eq('purpose', purpose)
    .is('verified_at', null);

  const code = generateVerificationCode();
  const expiresAt = calculateCodeExpiry(timestamp);

  const { error } = await supabaseAdmin
    .from('email_verification_codes')
    .insert({
      email,
      code,
      purpose,
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    throw new Error(`Failed to create verification code: ${error.message}`);
  }

  return { code, expiresIn: CODE_EXPIRY_MINUTES * 60 }; // Return seconds
}

/**
 * Verify a code submitted by the user
 */
export async function verifyCode(
  email: string,
  code: string,
  purpose: 'account_creation' | 'password_reset' | 'login',
  timestamp: Date
): Promise<{ valid: boolean; error?: string }> {
  // Get the most recent code for this email and purpose
  const { data, error } = await supabaseAdmin
    .from('email_verification_codes')
    .select('*')
    .eq('email', email)
    .eq('purpose', purpose)
    .is('verified_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return { valid: false, error: 'No verification code found. Please request a new code.' };
  }

  // Check if code is expired
  if (new Date(data.expires_at) < timestamp) {
    return { valid: false, error: 'Verification code has expired. Please request a new code.' };
  }

  // Check attempts
  if (data.attempts >= MAX_ATTEMPTS) {
    return { valid: false, error: 'Too many failed attempts. Please request a new code.' };
  }

  // Verify the code
  if (data.code !== code) {
    // Increment attempts
    await supabaseAdmin
      .from('email_verification_codes')
      .update({ attempts: data.attempts + 1 })
      .eq('id', data.id);

    const remainingAttempts = MAX_ATTEMPTS - data.attempts - 1;
    return {
      valid: false,
      error: remainingAttempts > 0
        ? `Invalid code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`
        : 'Too many failed attempts. Please request a new code.',
    };
  }

  // Mark as verified
  await supabaseAdmin
    .from('email_verification_codes')
    .update({ verified_at: timestamp.toISOString() })
    .eq('id', data.id);

  return { valid: true };
}

/**
 * Check if a verification code was recently verified (within the last 5 minutes)
 * This is used to prevent race conditions during account creation
 */
export async function wasRecentlyVerified(
  email: string,
  purpose: 'account_creation' | 'password_reset' | 'login',
  timestamp: Date
): Promise<boolean> {
  const fiveMinutesAgo = new Date(timestamp);
  fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

  const { data, error } = await supabaseAdmin
    .from('email_verification_codes')
    .select('id')
    .eq('email', email)
    .eq('purpose', purpose)
    .gte('verified_at', fiveMinutesAgo.toISOString())
    .limit(1);

  if (error) {
    return false;
  }

  return data && data.length > 0;
}

