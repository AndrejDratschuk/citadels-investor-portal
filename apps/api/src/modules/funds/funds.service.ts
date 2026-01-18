import { supabaseAdmin } from '../../common/database/supabase';

export interface FundBranding {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface FundAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface Fund {
  id: string;
  name: string;
  legalName: string;
  address: FundAddress;
  branding: FundBranding;
  status: string;
}

export interface UpdateFundProfileInput {
  name?: string;
  legalName?: string;
  address?: FundAddress;
}

export interface CreateFundInput {
  name: string;
  fundType: string;
  displayRole: string;
  entityName?: string;
  country: string;
}

export interface CreateFundResult {
  success: boolean;
  fund: {
    id: string;
    name: string;
    slug: string;
    fundType: string;
    country: string;
  };
}

export class FundsService {
  /**
   * Get fund by ID
   */
  async getById(fundId: string): Promise<Fund | null> {
    const { data, error } = await supabaseAdmin
      .from('funds')
      .select('id, name, legal_name, address, branding, status')
      .eq('id', fundId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      legalName: data.legal_name,
      address: data.address || {},
      branding: data.branding || {},
      status: data.status,
    };
  }

  /**
   * Update fund profile (name, legal name, address)
   */
  async updateProfile(fundId: string, input: UpdateFundProfileInput): Promise<Fund> {
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.legalName !== undefined) {
      updateData.legal_name = input.legalName;
    }
    if (input.address !== undefined) {
      updateData.address = input.address;
    }

    const { data, error } = await supabaseAdmin
      .from('funds')
      .update(updateData)
      .eq('id', fundId)
      .select('id, name, legal_name, address, branding, status')
      .single();

    if (error) {
      console.error('Error updating fund profile:', error);
      throw new Error('Failed to update fund profile');
    }

    return {
      id: data.id,
      name: data.name,
      legalName: data.legal_name,
      address: data.address || {},
      branding: data.branding || {},
      status: data.status,
    };
  }

  /**
   * Get fund branding (public - for forms)
   */
  async getBranding(fundId: string): Promise<{ name: string; branding: FundBranding } | null> {
    const { data, error } = await supabaseAdmin
      .from('funds')
      .select('name, branding')
      .eq('id', fundId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      name: data.name,
      branding: data.branding || {},
    };
  }

  /**
   * Update fund branding
   */
  async updateBranding(fundId: string, branding: FundBranding): Promise<Fund> {
    // Get current branding first to merge
    const { data: currentData } = await supabaseAdmin
      .from('funds')
      .select('branding')
      .eq('id', fundId)
      .single();

    const currentBranding = currentData?.branding || {};
    const newBranding = { ...currentBranding, ...branding };

    const { data, error } = await supabaseAdmin
      .from('funds')
      .update({ branding: newBranding })
      .eq('id', fundId)
      .select('id, name, legal_name, branding, status')
      .single();

    if (error) {
      console.error('Error updating fund branding:', error);
      throw new Error('Failed to update fund branding');
    }

    return {
      id: data.id,
      name: data.name,
      legalName: data.legal_name,
      branding: data.branding || {},
      status: data.status,
    };
  }

  /**
   * Upload logo to Supabase Storage
   */
  async uploadLogo(
    fundId: string,
    fileBuffer: Buffer,
    fileName: string,
    contentType: string
  ): Promise<string> {
    // Generate unique file path
    const fileExt = fileName.split('.').pop() || 'png';
    const filePath = `logos/${fundId}/logo.${fileExt}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('fund-assets')
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error('Error uploading logo:', uploadError);
      throw new Error('Failed to upload logo');
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('fund-assets')
      .getPublicUrl(filePath);

    const logoUrl = urlData.publicUrl;

    // Update fund branding with logo URL
    await this.updateBranding(fundId, { logoUrl });

    return logoUrl;
  }

  /**
   * Delete logo
   */
  async deleteLogo(fundId: string): Promise<void> {
    // Remove from storage
    const { error: deleteError } = await supabaseAdmin.storage
      .from('fund-assets')
      .remove([`logos/${fundId}/logo.png`, `logos/${fundId}/logo.jpg`, `logos/${fundId}/logo.jpeg`]);

    if (deleteError) {
      console.error('Error deleting logo:', deleteError);
      // Don't throw, just log - file might not exist
    }

    // Update branding to remove logo URL
    const { data: currentData } = await supabaseAdmin
      .from('funds')
      .select('branding')
      .eq('id', fundId)
      .single();

    if (currentData?.branding) {
      const newBranding = { ...currentData.branding };
      delete newBranding.logoUrl;
      
      await supabaseAdmin
        .from('funds')
        .update({ branding: newBranding })
        .eq('id', fundId);
    }
  }

  /**
   * Create a new fund (for onboarding flow)
   * Uses a SECURITY DEFINER function to bypass RLS for this bootstrap operation
   * Also sets user's onboarding_completed = true and assigns them to the fund
   */
  async createFund(userId: string, input: CreateFundInput, _accessToken: string): Promise<CreateFundResult> {
    console.log('[createFund] Starting fund creation for user:', userId);
    
    // Generate slug from fund name
    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    console.log('[createFund] Calling RPC create_fund_for_user with slug:', slug);

    // Call the SECURITY DEFINER function that bypasses RLS
    const { data: fundId, error: rpcError } = await supabaseAdmin
      .rpc('create_fund_for_user', {
        p_user_id: userId,
        p_name: input.name,
        p_slug: slug,
        p_fund_type: input.fundType || null,
        p_country: input.country || null,
      });

    if (rpcError) {
      console.error('[createFund] RPC error:', rpcError);
      throw new Error(`Failed to create fund: ${rpcError.message}`);
    }

    console.log('[createFund] Fund created successfully with ID:', fundId);

    // Fetch the created fund details
    const { data: fundData, error: fetchError } = await supabaseAdmin
      .from('funds')
      .select('id, name, slug, fund_type, country')
      .eq('id', fundId)
      .single();

    if (fetchError || !fundData) {
      throw new Error('Fund created but failed to fetch details');
    }

    return {
      success: true,
      fund: {
        id: fundData.id,
        name: fundData.name,
        slug: fundData.slug,
        fundType: fundData.fund_type,
        country: fundData.country,
      },
    };
  }

  /**
   * Check if a fund name/slug is available
   */
  async checkSlugAvailability(name: string): Promise<{ available: boolean; slug: string }> {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const { data: existingFund } = await supabaseAdmin
      .from('funds')
      .select('id')
      .eq('slug', slug)
      .single();

    return {
      available: !existingFund,
      slug,
    };
  }

}

export const fundsService = new FundsService();

