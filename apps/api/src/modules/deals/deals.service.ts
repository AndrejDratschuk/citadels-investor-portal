import { supabaseAdmin } from '../../common/database/supabase';

export interface DealKPIs {
  noi?: number;
  capRate?: number;
  cashOnCash?: number;
  occupancyRate?: number;
  renovationBudget?: number;
  renovationSpent?: number;
}

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
  imageUrl: string | null;
  kpis?: DealKPIs | null;
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
  currentValue?: number;
  kpis?: DealKPIs;
}

export interface DealInvestor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  ownershipPercentage: number;
  commitmentAmount: number;
  joinedAt: string;
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
    if (input.currentValue !== undefined) updateData.current_value = input.currentValue;
    if (input.kpis !== undefined) updateData.kpis = input.kpis;

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

  /**
   * Upload deal image to Supabase Storage
   */
  async uploadImage(
    fundId: string,
    dealId: string,
    fileBuffer: Buffer,
    fileName: string,
    contentType: string
  ): Promise<string> {
    // Verify the deal belongs to this fund
    const deal = await this.getById(fundId, dealId);
    if (!deal) {
      throw new Error('Deal not found');
    }

    // Generate unique file path
    const fileExt = fileName.split('.').pop() || 'jpg';
    const filePath = `deals/${dealId}/image.${fileExt}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('deal-images')
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error('Error uploading deal image:', uploadError);
      throw new Error('Failed to upload deal image');
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('deal-images')
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    // Update deal with image URL
    await supabaseAdmin
      .from('deals')
      .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
      .eq('id', dealId)
      .eq('fund_id', fundId);

    return imageUrl;
  }

  /**
   * Get investors for a specific deal with their ownership percentages
   */
  async getDealInvestors(fundId: string, dealId: string): Promise<DealInvestor[]> {
    // Verify the deal belongs to this fund
    const deal = await this.getById(fundId, dealId);
    if (!deal) {
      throw new Error('Deal not found');
    }

    const { data, error } = await supabaseAdmin
      .from('investor_deals')
      .select(`
        ownership_percentage,
        joined_at,
        investor:investors (
          id,
          first_name,
          last_name,
          email,
          commitment_amount
        )
      `)
      .eq('deal_id', dealId);

    if (error) {
      console.error('Error fetching deal investors:', error);
      throw new Error('Failed to fetch deal investors');
    }

    return (data || [])
      .filter((item: any) => item.investor)
      .map((item: any) => ({
        id: item.investor.id,
        firstName: item.investor.first_name,
        lastName: item.investor.last_name,
        email: item.investor.email,
        ownershipPercentage: parseFloat(item.ownership_percentage) || 0,
        commitmentAmount: item.investor.commitment_amount || 0,
        joinedAt: item.joined_at,
      }));
  }

  /**
   * Delete deal image
   */
  async deleteImage(fundId: string, dealId: string): Promise<void> {
    // Verify the deal belongs to this fund
    const deal = await this.getById(fundId, dealId);
    if (!deal) {
      throw new Error('Deal not found');
    }

    // Remove from storage (try common extensions)
    const { error: deleteError } = await supabaseAdmin.storage
      .from('deal-images')
      .remove([
        `deals/${dealId}/image.png`,
        `deals/${dealId}/image.jpg`,
        `deals/${dealId}/image.jpeg`,
        `deals/${dealId}/image.webp`,
      ]);

    if (deleteError) {
      console.error('Error deleting deal image:', deleteError);
      // Don't throw, just log - file might not exist
    }

    // Update deal to remove image URL
    await supabaseAdmin
      .from('deals')
      .update({ image_url: null, updated_at: new Date().toISOString() })
      .eq('id', dealId)
      .eq('fund_id', fundId);
  }

  /**
   * Add an investor to a deal with ownership percentage
   */
  async addInvestorToDeal(
    fundId: string,
    dealId: string,
    investorId: string,
    ownershipPercentage: number
  ): Promise<DealInvestor> {
    // Verify the deal belongs to this fund
    const deal = await this.getById(fundId, dealId);
    if (!deal) {
      throw new Error('Deal not found');
    }

    // Verify investor belongs to this fund
    const { data: investor, error: investorError } = await supabaseAdmin
      .from('investors')
      .select('id, first_name, last_name, email, commitment_amount, fund_id')
      .eq('id', investorId)
      .eq('fund_id', fundId)
      .single();

    if (investorError || !investor) {
      throw new Error('Investor not found');
    }

    // Upsert investor-deal relationship
    const { error } = await supabaseAdmin
      .from('investor_deals')
      .upsert({
        investor_id: investorId,
        deal_id: dealId,
        ownership_percentage: ownershipPercentage,
        joined_at: new Date().toISOString(),
      }, {
        onConflict: 'investor_id,deal_id',
      });

    if (error) {
      console.error('Error adding investor to deal:', error);
      throw new Error('Failed to add investor to deal');
    }

    return {
      id: investor.id,
      firstName: investor.first_name,
      lastName: investor.last_name,
      email: investor.email,
      ownershipPercentage,
      commitmentAmount: investor.commitment_amount || 0,
      joinedAt: new Date().toISOString(),
    };
  }

  /**
   * Remove an investor from a deal
   */
  async removeInvestorFromDeal(
    fundId: string,
    dealId: string,
    investorId: string
  ): Promise<void> {
    // Verify the deal belongs to this fund
    const deal = await this.getById(fundId, dealId);
    if (!deal) {
      throw new Error('Deal not found');
    }

    const { error } = await supabaseAdmin
      .from('investor_deals')
      .delete()
      .eq('investor_id', investorId)
      .eq('deal_id', dealId);

    if (error) {
      console.error('Error removing investor from deal:', error);
      throw new Error('Failed to remove investor from deal');
    }
  }

  /**
   * Update investor's ownership percentage in a deal
   */
  async updateDealInvestorOwnership(
    fundId: string,
    dealId: string,
    investorId: string,
    ownershipPercentage: number
  ): Promise<void> {
    // Verify the deal belongs to this fund
    const deal = await this.getById(fundId, dealId);
    if (!deal) {
      throw new Error('Deal not found');
    }

    const { error } = await supabaseAdmin
      .from('investor_deals')
      .update({ ownership_percentage: ownershipPercentage })
      .eq('investor_id', investorId)
      .eq('deal_id', dealId);

    if (error) {
      console.error('Error updating investor ownership:', error);
      throw new Error('Failed to update investor ownership');
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
      imageUrl: data.image_url,
      kpis: data.kpis,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

export const dealsService = new DealsService();







