import { supabaseAdmin } from '../../common/database/supabase';

export interface Deal {
  id: string;
  fundId: string;
  name: string;
  description: string | null;
  status: 'prospective' | 'under_contract' | 'acquired' | 'renovating' | 'stabilized' | 'for_sale' | 'sold';
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;
  propertyType: 'multifamily' | 'office' | 'retail' | 'industrial' | 'other' | null;
  unitCount: number | null;
  squareFootage: number | null;
  acquisitionPrice: number | null;
  acquisitionDate: string | null;
  currentValue: number | null;
  createdAt: string;
  updatedAt: string;
  // Computed
  investorCount?: number;
  documentCount?: number;
}

export interface CreateDealInput {
  name: string;
  description?: string;
  status?: Deal['status'];
  address?: Deal['address'];
  propertyType?: Deal['propertyType'];
  unitCount?: number;
  squareFootage?: number;
  acquisitionPrice?: number;
  acquisitionDate?: string;
}

const statusLabels: Record<string, string> = {
  prospective: 'Prospective',
  under_contract: 'Under Contract',
  acquired: 'Acquired',
  renovating: 'Renovating',
  stabilized: 'Stabilized',
  for_sale: 'For Sale',
  sold: 'Sold',
};

export class DealsService {
  /**
   * Get all deals for a fund
   */
  async getAllByFundId(fundId: string): Promise<Deal[]> {
    const { data, error } = await supabaseAdmin
      .from('deals')
      .select('*')
      .eq('fund_id', fundId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching deals:', error);
      throw new Error('Failed to fetch deals');
    }

    // Get investor counts per deal
    const { data: investorDeals } = await supabaseAdmin
      .from('investor_deals')
      .select('deal_id, investor_id');

    // Get document counts per deal
    const { data: documents } = await supabaseAdmin
      .from('documents')
      .select('deal_id')
      .eq('fund_id', fundId)
      .not('deal_id', 'is', null);

    const investorCountMap: Record<string, number> = {};
    const docCountMap: Record<string, number> = {};

    investorDeals?.forEach(inv => {
      if (inv.deal_id) {
        investorCountMap[inv.deal_id] = (investorCountMap[inv.deal_id] || 0) + 1;
      }
    });

    documents?.forEach(doc => {
      if (doc.deal_id) {
        docCountMap[doc.deal_id] = (docCountMap[doc.deal_id] || 0) + 1;
      }
    });

    return data.map(deal => ({
      ...this.formatDeal(deal),
      investorCount: investorCountMap[deal.id] || 0,
      documentCount: docCountMap[deal.id] || 0,
    }));
  }

  /**
   * Get a single deal by ID
   */
  async getById(fundId: string, dealId: string): Promise<Deal | null> {
    const { data, error } = await supabaseAdmin
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .eq('fund_id', fundId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.formatDeal(data);
  }

  /**
   * Create a new deal
   */
  async create(fundId: string, input: CreateDealInput): Promise<Deal> {
    const { data, error } = await supabaseAdmin
      .from('deals')
      .insert({
        fund_id: fundId,
        name: input.name,
        description: input.description || null,
        status: input.status || 'prospective',
        address: input.address || null,
        property_type: input.propertyType || null,
        unit_count: input.unitCount || null,
        square_footage: input.squareFootage || null,
        acquisition_price: input.acquisitionPrice || null,
        acquisition_date: input.acquisitionDate || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating deal:', error);
      throw new Error('Failed to create deal');
    }

    return this.formatDeal(data);
  }

  /**
   * Update a deal
   */
  async update(fundId: string, dealId: string, input: Partial<CreateDealInput>): Promise<Deal> {
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.propertyType !== undefined) updateData.property_type = input.propertyType;
    if (input.unitCount !== undefined) updateData.unit_count = input.unitCount;
    if (input.squareFootage !== undefined) updateData.square_footage = input.squareFootage;
    if (input.acquisitionPrice !== undefined) updateData.acquisition_price = input.acquisitionPrice;
    if (input.acquisitionDate !== undefined) updateData.acquisition_date = input.acquisitionDate;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('deals')
      .update(updateData)
      .eq('id', dealId)
      .eq('fund_id', fundId)
      .select()
      .single();

    if (error) {
      console.error('Error updating deal:', error);
      throw new Error('Failed to update deal');
    }

    return this.formatDeal(data);
  }

  /**
   * Delete a deal
   */
  async delete(fundId: string, dealId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('deals')
      .delete()
      .eq('id', dealId)
      .eq('fund_id', fundId);

    if (error) {
      console.error('Error deleting deal:', error);
      throw new Error('Failed to delete deal');
    }
  }

  private formatDeal(data: any): Deal {
    return {
      id: data.id,
      fundId: data.fund_id,
      name: data.name,
      description: data.description,
      status: data.status,
      address: data.address,
      propertyType: data.property_type,
      unitCount: data.unit_count,
      squareFootage: data.square_footage,
      acquisitionPrice: data.acquisition_price,
      acquisitionDate: data.acquisition_date,
      currentValue: data.current_value,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

export const dealsService = new DealsService();



