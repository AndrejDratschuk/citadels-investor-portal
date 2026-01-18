/**
 * Get Manager Emails for Fund
 * Pure operator function that fetches all manager email addresses for a fund
 * Bubbles errors up - no try/catch
 */

import { supabaseAdmin } from '../../common/database/supabase';

/**
 * Fetch all manager email addresses for a given fund
 * @param fundId - The fund ID to fetch managers for
 * @returns Array of manager email addresses
 */
export async function getManagerEmailsForFund(fundId: string): Promise<string[]> {
  const { data: managers, error } = await supabaseAdmin
    .from('users')
    .select('email')
    .eq('fund_id', fundId)
    .eq('role', 'manager');

  if (error) {
    throw new Error(`Failed to fetch managers for fund ${fundId}: ${error.message}`);
  }

  if (!managers || managers.length === 0) {
    console.warn(`[getManagerEmailsForFund] No managers found for fund ${fundId}`);
    return [];
  }

  return managers.map(m => m.email).filter((email): email is string => !!email);
}
