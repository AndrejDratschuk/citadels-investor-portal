import { supabaseAdmin } from '../../common/database/supabase';
import { webhookService } from '../../common/services/webhook.service';

export interface CreateCapitalCallInput {
  dealId: string;
  totalAmount: number;
  deadline: string;
}

export interface CapitalCall {
  id: string;
  fundId: string;
  dealId: string;
  totalAmount: number;
  percentageOfFund: number;
  deadline: string;
  status: 'draft' | 'sent' | 'partial' | 'funded' | 'closed';
  sentAt: string | null;
  createdAt: string;
}

export interface CapitalCallWithDeal extends CapitalCall {
  deal: {
    id: string;
    name: string;
  };
}

export interface CapitalCallItem {
  id: string;
  capitalCallId: string;
  investorId: string;
  amountDue: number;
  amountReceived: number;
  status: 'pending' | 'partial' | 'complete';
  wireReceivedAt: string | null;
  reminderCount: number;
  lastReminderAt: string | null;
  createdAt: string;
}

export interface CapitalCallItemWithInvestor extends CapitalCallItem {
  investor: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface InvestorContext {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface FundContext {
  id: string;
  name: string;
  wireInstructions?: {
    bankName: string;
    routingNumber: string;
    accountNumber: string;
  };
}

export class CapitalCallsService {
  /**
   * Create a new capital call
   */
  async create(fundId: string, input: CreateCapitalCallInput, userId: string): Promise<CapitalCallWithDeal> {
    // Get deal info for the response and webhook
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select('id, name, fund_id')
      .eq('id', input.dealId)
      .eq('fund_id', fundId)
      .single();

    if (dealError || !deal) {
      throw new Error('Deal not found or does not belong to this fund');
    }

    // Create the capital call
    const { data, error } = await supabaseAdmin
      .from('capital_calls')
      .insert({
        fund_id: fundId,
        deal_id: input.dealId,
        total_amount: input.totalAmount,
        percentage_of_fund: 0, // Will be calculated based on fund size
        deadline: input.deadline,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating capital call:', error);
      throw new Error('Failed to create capital call');
    }

    // TODO: Create capital_call_items for each investor based on their ownership percentage
    // This would require fetching investors and their commitments for this deal

    // Send webhook for new capital call
    webhookService.sendWebhook('capital_call.created', {
      id: data.id,
      fundId: fundId,
      dealId: input.dealId,
      dealName: deal.name,
      totalAmount: input.totalAmount,
      deadline: input.deadline,
      status: 'pending',
      createdAt: data.created_at,
    });

    return {
      id: data.id,
      fundId: data.fund_id,
      dealId: data.deal_id,
      totalAmount: data.total_amount,
      deadline: data.deadline,
      status: data.status,
      percentageOfFund: data.percentage_of_fund || 0,
      sentAt: data.sent_at,
      createdAt: data.created_at,
      deal: {
        id: deal.id,
        name: deal.name,
      },
    };
  }

  /**
   * Get all capital calls for a fund
   */
  async getAllByFundId(fundId: string): Promise<CapitalCallWithDeal[]> {
    const { data, error } = await supabaseAdmin
      .from('capital_calls')
      .select(`
        *,
        deal:deals (id, name)
      `)
      .eq('fund_id', fundId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching capital calls:', error);
      throw new Error('Failed to fetch capital calls');
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      fundId: item.fund_id,
      dealId: item.deal_id,
      totalAmount: item.total_amount,
      deadline: item.deadline,
      status: item.status,
      percentageOfFund: item.percentage_of_fund || 0,
      sentAt: item.sent_at,
      createdAt: item.created_at,
      deal: item.deal ? {
        id: item.deal.id,
        name: item.deal.name,
      } : { id: '', name: 'Unknown' },
    }));
  }

  /**
   * Get a single capital call by ID
   */
  async getById(id: string, fundId: string): Promise<CapitalCallWithDeal> {
    const { data, error } = await supabaseAdmin
      .from('capital_calls')
      .select(`
        *,
        deal:deals (id, name)
      `)
      .eq('id', id)
      .eq('fund_id', fundId)
      .single();

    if (error) {
      console.error('Error fetching capital call:', error);
      throw new Error('Capital call not found');
    }

    return {
      id: data.id,
      fundId: data.fund_id,
      dealId: data.deal_id,
      totalAmount: data.total_amount,
      deadline: data.deadline,
      status: data.status,
      percentageOfFund: data.percentage_of_fund || 0,
      sentAt: data.sent_at,
      createdAt: data.created_at,
      deal: data.deal ? {
        id: data.deal.id,
        name: data.deal.name,
      } : { id: '', name: 'Unknown' },
    };
  }

  /**
   * Get capital call items for a capital call
   */
  async getItemsByCapitalCallId(capitalCallId: string): Promise<CapitalCallItemWithInvestor[]> {
    const { data, error } = await supabaseAdmin
      .from('capital_call_items')
      .select(`
        *,
        investor:investors (id, email, first_name, last_name)
      `)
      .eq('capital_call_id', capitalCallId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching capital call items:', error);
      throw new Error('Failed to fetch capital call items');
    }

    return (data || []).map((item: Record<string, unknown>) => this.formatCapitalCallItem(item));
  }

  /**
   * Get a single capital call item by ID
   */
  async getItemById(itemId: string): Promise<CapitalCallItemWithInvestor | null> {
    const { data, error } = await supabaseAdmin
      .from('capital_call_items')
      .select(`
        *,
        investor:investors (id, email, first_name, last_name)
      `)
      .eq('id', itemId)
      .single();

    if (error) {
      console.error('Error fetching capital call item:', error);
      return null;
    }

    return this.formatCapitalCallItem(data);
  }

  /**
   * Confirm wire received for a capital call item
   */
  async confirmWireReceived(
    itemId: string,
    amountReceived: number,
    timestamp: Date
  ): Promise<CapitalCallItemWithInvestor> {
    const { data, error } = await supabaseAdmin
      .from('capital_call_items')
      .update({
        amount_received: amountReceived,
        status: 'complete',
        wire_received_at: timestamp.toISOString(),
      })
      .eq('id', itemId)
      .select(`
        *,
        investor:investors (id, email, first_name, last_name)
      `)
      .single();

    if (error) {
      console.error('Error confirming wire:', error);
      throw new Error('Failed to confirm wire received');
    }

    return this.formatCapitalCallItem(data);
  }

  /**
   * Report wire issue for a capital call item (does not update status, just triggers email)
   */
  async getItemForWireIssue(itemId: string): Promise<CapitalCallItemWithInvestor | null> {
    return this.getItemById(itemId);
  }

  /**
   * Get fund context for emails
   */
  async getFundContext(fundId: string): Promise<FundContext | null> {
    const { data, error } = await supabaseAdmin
      .from('funds')
      .select('id, name, bank_info_encrypted')
      .eq('id', fundId)
      .single();

    if (error || !data) {
      return null;
    }

    // Parse bank info if available
    let wireInstructions: FundContext['wireInstructions'];
    if (data.bank_info_encrypted) {
      try {
        const bankInfo = data.bank_info_encrypted as Record<string, string>;
        wireInstructions = {
          bankName: bankInfo.bankName || '',
          routingNumber: bankInfo.routingNumber || '',
          accountNumber: bankInfo.accountNumber || '',
        };
      } catch {
        // Invalid bank info format
      }
    }

    return {
      id: data.id,
      name: data.name,
      wireInstructions,
    };
  }

  /**
   * Get investor context for emails
   */
  async getInvestorContext(investorId: string): Promise<InvestorContext | null> {
    const { data, error } = await supabaseAdmin
      .from('investors')
      .select('id, email, first_name, last_name')
      .eq('id', investorId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
    };
  }

  /**
   * Get call number for a capital call (simple sequential based on creation order)
   */
  async getCallNumber(capitalCallId: string, fundId: string): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('capital_calls')
      .select('id, created_at')
      .eq('fund_id', fundId)
      .order('created_at', { ascending: true });

    if (error || !data) {
      return '1';
    }

    const index = data.findIndex(cc => cc.id === capitalCallId);
    return String(index + 1);
  }

  private formatCapitalCallItem(item: Record<string, unknown>): CapitalCallItemWithInvestor {
    const investor = item.investor as Record<string, unknown> | null;
    return {
      id: item.id as string,
      capitalCallId: item.capital_call_id as string,
      investorId: item.investor_id as string,
      amountDue: item.amount_due as number,
      amountReceived: (item.amount_received as number) || 0,
      status: item.status as CapitalCallItem['status'],
      wireReceivedAt: item.wire_received_at as string | null,
      reminderCount: (item.reminder_count as number) || 0,
      lastReminderAt: item.last_reminder_at as string | null,
      createdAt: item.created_at as string,
      investor: investor ? {
        id: investor.id as string,
        email: investor.email as string,
        firstName: investor.first_name as string,
        lastName: investor.last_name as string,
      } : {
        id: '',
        email: '',
        firstName: '',
        lastName: '',
      },
    };
  }
}

export const capitalCallsService = new CapitalCallsService();

