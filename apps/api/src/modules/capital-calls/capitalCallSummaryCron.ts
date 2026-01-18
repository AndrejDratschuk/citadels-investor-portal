/**
 * Capital Call Summary Cron Job
 * Sends daily/weekly summary emails to fund managers during active capital call periods
 * Follows Orchestrator/Operator pattern per CODE_GUIDELINES.md
 */

import { supabaseAdmin } from '../../common/database/supabase';
import { emailService } from '../email/email.service';
import { getManagerEmailsForFund } from '../team-invites/getManagerEmailsForFund';

// ============================================================
// Types
// ============================================================

interface ActiveCapitalCall {
  id: string;
  fundId: string;
  fundName: string;
  dealId: string;
  dealName: string;
  callNumber: number;
  totalAmount: number;
  deadline: string;
  status: string;
}

interface CapitalCallStats {
  capitalCallId: string;
  capitalCallNumber: string;
  dealName: string;
  fundId: string;
  fundName: string;
  totalCalled: number;
  totalReceived: number;
  percentReceived: number;
  totalOutstanding: number;
  totalPastDue: number;
}

type SummaryFrequency = 'daily' | 'weekly' | 'none';

// ============================================================
// Operator Functions (Pure, bubble errors up)
// ============================================================

/**
 * Get all active capital calls with their fund info
 * Operator - no try/catch, bubbles errors
 */
async function getActiveCapitalCalls(): Promise<ActiveCapitalCall[]> {
  const { data, error } = await supabaseAdmin
    .from('capital_calls')
    .select(`
      id,
      fund_id,
      deal_id,
      total_amount,
      deadline,
      status,
      call_number,
      funds!inner(name, platform_name),
      deals!inner(name)
    `)
    .in('status', ['sent', 'partial']);

  if (error) {
    throw new Error(`Failed to fetch active capital calls: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((call) => ({
    id: call.id,
    fundId: call.fund_id,
    fundName: (call.funds as { name: string })?.name || 'Unknown Fund',
    dealId: call.deal_id,
    dealName: (call.deals as { name: string })?.name || 'Unknown Deal',
    callNumber: call.call_number || 1,
    totalAmount: parseFloat(call.total_amount) || 0,
    deadline: call.deadline,
    status: call.status,
  }));
}

/**
 * Get all capital call items for a specific call
 */
async function getCapitalCallItems(capitalCallId: string): Promise<Array<{
  amountDue: number;
  amountReceived: number;
  status: string;
}>> {
  const { data, error } = await supabaseAdmin
    .from('capital_call_items')
    .select('amount_due, amount_received, status')
    .eq('capital_call_id', capitalCallId);

  if (error) {
    throw new Error(`Failed to fetch capital call items: ${error.message}`);
  }

  return (data || []).map((item) => ({
    amountDue: parseFloat(item.amount_due) || 0,
    amountReceived: parseFloat(item.amount_received) || 0,
    status: item.status,
  }));
}

/**
 * Calculate stats for a capital call
 * Pure function - no side effects
 */
function calculateCapitalCallStats(
  call: ActiveCapitalCall,
  items: Array<{ amountDue: number; amountReceived: number; status: string }>,
  timestamp: Date
): CapitalCallStats {
  const totalCalled = items.reduce((sum, item) => sum + item.amountDue, 0);
  const totalReceived = items.reduce((sum, item) => sum + item.amountReceived, 0);
  const totalOutstanding = totalCalled - totalReceived;
  
  // Calculate past due (items where status is pending and deadline has passed)
  const deadlineDate = new Date(call.deadline);
  const isPastDeadline = timestamp > deadlineDate;
  const totalPastDue = isPastDeadline
    ? items
        .filter(item => item.status === 'pending' || item.status === 'partial')
        .reduce((sum, item) => sum + (item.amountDue - item.amountReceived), 0)
    : 0;

  const percentReceived = totalCalled > 0 
    ? Math.round((totalReceived / totalCalled) * 100) 
    : 0;

  return {
    capitalCallId: call.id,
    capitalCallNumber: String(call.callNumber),
    dealName: call.dealName,
    fundId: call.fundId,
    fundName: call.fundName,
    totalCalled,
    totalReceived,
    percentReceived,
    totalOutstanding,
    totalPastDue,
  };
}

/**
 * Get fund's notification frequency preference
 * Operator - bubbles errors
 */
async function getFundSummaryFrequency(fundId: string): Promise<SummaryFrequency> {
  const { data, error } = await supabaseAdmin
    .from('funds')
    .select('capital_call_summary_frequency')
    .eq('id', fundId)
    .single();

  if (error) {
    // Default to daily if column doesn't exist or fund not found
    console.warn(`[CapCallSummaryCron] Could not get frequency for fund ${fundId}, defaulting to daily`);
    return 'daily';
  }

  return (data?.capital_call_summary_frequency as SummaryFrequency) || 'daily';
}

/**
 * Determine if summary should be sent based on frequency and day of week
 * Pure function - no side effects
 */
function shouldSendSummary(frequency: SummaryFrequency, dayOfWeek: number): boolean {
  if (frequency === 'none') return false;
  if (frequency === 'daily') return true;
  // Weekly - send on Monday (dayOfWeek === 1)
  if (frequency === 'weekly') return dayOfWeek === 1;
  return false;
}

/**
 * Format amount as currency string
 * Pure function
 */
function formatAmount(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Get portal URL for report
 */
function getReportUrl(capitalCallId: string): string {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${baseUrl}/manager/capital-calls/${capitalCallId}`;
}

// ============================================================
// Orchestrator Function (handles errors, injects timestamp)
// ============================================================

/**
 * Run the capital call summary cron job
 * Orchestrator - try/catch, injects timestamp
 * @param timestamp - Injected timestamp from caller
 */
export async function runCapitalCallSummaryCron(timestamp: Date): Promise<void> {
  console.log(`[CapCallSummaryCron] Starting at ${timestamp.toISOString()}`);
  
  try {
    const dayOfWeek = timestamp.getDay(); // 0 = Sunday, 1 = Monday, ...
    
    // Get all active capital calls
    const activeCalls = await getActiveCapitalCalls();
    
    if (activeCalls.length === 0) {
      console.log('[CapCallSummaryCron] No active capital calls found');
      return;
    }

    console.log(`[CapCallSummaryCron] Found ${activeCalls.length} active capital call(s)`);

    // Group calls by fund
    const callsByFund = new Map<string, ActiveCapitalCall[]>();
    for (const call of activeCalls) {
      const existing = callsByFund.get(call.fundId) || [];
      existing.push(call);
      callsByFund.set(call.fundId, existing);
    }

    // Process each fund
    let emailsSent = 0;
    for (const [fundId, fundCalls] of callsByFund) {
      // Check frequency preference
      const frequency = await getFundSummaryFrequency(fundId);
      
      if (!shouldSendSummary(frequency, dayOfWeek)) {
        console.log(`[CapCallSummaryCron] Skipping fund ${fundId} (frequency: ${frequency})`);
        continue;
      }

      // Get manager emails for this fund
      const managerEmails = await getManagerEmailsForFund(fundId);
      
      if (managerEmails.length === 0) {
        console.warn(`[CapCallSummaryCron] No managers found for fund ${fundId}`);
        continue;
      }

      // Send summary for each capital call in this fund
      for (const call of fundCalls) {
        const items = await getCapitalCallItems(call.id);
        const stats = calculateCapitalCallStats(call, items, timestamp);

        // Send to all managers
        for (const managerEmail of managerEmails) {
          const result = await emailService.sendInternalCapitalCallSummary(managerEmail, {
            capitalCallNumber: stats.capitalCallNumber,
            dealName: stats.dealName,
            totalCalled: formatAmount(stats.totalCalled),
            totalReceived: formatAmount(stats.totalReceived),
            percentReceived: String(stats.percentReceived),
            totalOutstanding: formatAmount(stats.totalOutstanding),
            totalPastDue: formatAmount(stats.totalPastDue),
            fundName: stats.fundName,
            viewReportUrl: getReportUrl(call.id),
          });

          if (result.success) {
            emailsSent++;
          } else {
            console.error(
              `[CapCallSummaryCron] Failed to send summary to ${managerEmail}: ${result.error}`
            );
          }
        }
      }
    }

    console.log(`[CapCallSummaryCron] Completed - sent ${emailsSent} email(s)`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[CapCallSummaryCron] Error: ${message}`);
    throw error;
  }
}
