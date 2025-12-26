import { randomBytes } from 'crypto';
import { supabaseAdmin } from '../../common/database/supabase';

/**
 * Token expiration time in days
 */
const TOKEN_EXPIRY_DAYS = 7;

/**
 * Generate a cryptographically secure token
 */
export function generateToken(byteLength: number = 32): string {
  return randomBytes(byteLength).toString('hex');
}

/**
 * Calculate token expiration date
 */
export function calculateTokenExpiry(timestamp: Date, days: number = TOKEN_EXPIRY_DAYS): Date {
  const expiry = new Date(timestamp);
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}

/**
 * Create an account creation token for a KYC application
 */
export async function createAccountToken(
  kycApplicationId: string,
  fundId: string,
  email: string,
  timestamp: Date
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const expiresAt = calculateTokenExpiry(timestamp);

  const { error } = await supabaseAdmin
    .from('account_creation_tokens')
    .insert({
      kyc_application_id: kycApplicationId,
      fund_id: fundId,
      token,
      email,
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    throw new Error(`Failed to create account token: ${error.message}`);
  }

  return { token, expiresAt };
}

/**
 * Verify and retrieve token data
 */
export async function verifyToken(token: string, timestamp: Date): Promise<{
  valid: boolean;
  data?: {
    id: string;
    kycApplicationId: string;
    fundId: string;
    email: string;
    expiresAt: string;
    usedAt: string | null;
  };
  error?: string;
}> {
  const { data, error } = await supabaseAdmin
    .from('account_creation_tokens')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !data) {
    return { valid: false, error: 'Invalid token' };
  }

  // Check if token is expired
  if (new Date(data.expires_at) < timestamp) {
    return { valid: false, error: 'Token has expired' };
  }

  // Check if token has already been used
  if (data.used_at) {
    return { valid: false, error: 'Token has already been used' };
  }

  return {
    valid: true,
    data: {
      id: data.id,
      kycApplicationId: data.kyc_application_id,
      fundId: data.fund_id,
      email: data.email,
      expiresAt: data.expires_at,
      usedAt: data.used_at,
    },
  };
}

/**
 * Mark a token as used
 */
export async function markTokenUsed(token: string, timestamp: Date): Promise<void> {
  const { error } = await supabaseAdmin
    .from('account_creation_tokens')
    .update({ used_at: timestamp.toISOString() })
    .eq('token', token);

  if (error) {
    throw new Error(`Failed to mark token as used: ${error.message}`);
  }
}

/**
 * Get KYC application data for pre-filling account creation
 */
export async function getKycApplicationData(kycApplicationId: string): Promise<{
  firstName?: string;
  lastName?: string;
  email: string;
  fundId: string;
  fundName?: string;
} | null> {
  const { data, error } = await supabaseAdmin
    .from('kyc_applications')
    .select(`
      *,
      fund:funds(id, name)
    `)
    .eq('id', kycApplicationId)
    .single();

  if (error || !data) {
    return null;
  }

  // Handle both individual and entity KYC
  const firstName = data.investor_category === 'entity'
    ? data.authorized_signer_first_name
    : data.first_name;
  const lastName = data.investor_category === 'entity'
    ? data.authorized_signer_last_name
    : data.last_name;

  return {
    firstName,
    lastName,
    email: data.email,
    fundId: data.fund_id,
    fundName: data.fund?.name,
  };
}

