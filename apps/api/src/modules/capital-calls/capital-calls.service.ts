import { supabaseAdmin } from '../../common/database/supabase';
import { webhookService } from '../../common/services/webhook.service';

export interface CreateCapitalCallInput {
  dealId: string;
  totalAmount: number;
  deadline: string;
  notes?: string;
}

export interface CapitalCall {
  id: string;
  fundId: string;
  dealId: string;
  totalAmount: number;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CapitalCallWithDeal extends CapitalCall {
  deal: {
    id: string;
    name: string;
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
        deadline: input.deadline,
        status: 'pending',
        notes: input.notes || null,
        created_by: userId,
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
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
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
      notes: item.notes,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
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
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      deal: data.deal ? {
        id: data.deal.id,
        name: data.deal.name,
      } : { id: '', name: 'Unknown' },
    };
  }
}

export const capitalCallsService = new CapitalCallsService();

