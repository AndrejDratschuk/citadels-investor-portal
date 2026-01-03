import { supabaseAdmin, createSupabaseClient } from '../../common/database/supabase';

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
   * Also sets user's onboarding_completed = true and assigns them to the fund
   * Handles race conditions by retrying with new slug on unique constraint violation
   * @param accessToken - User's access token for RLS-aware fund creation
   */
  async createFund(userId: string, input: CreateFundInput, accessToken: string): Promise<CreateFundResult> {
    // Create user-context client for RLS-aware operations
    const supabaseUser = createSupabaseClient(accessToken);
    
    // Generate slug from fund name
    const baseSlug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = baseSlug;
    let fundData: Record<string, unknown> | null = null;
    let attempts = 0;
    const maxAttempts = 5;

    // Retry loop to handle race conditions on slug uniqueness
    // Use user-context client so RLS policies can evaluate auth.uid()
    while (attempts < maxAttempts) {
      const { data, error: fundError } = await supabaseUser
        .from('funds')
        .insert({
          name: input.name,
          legal_name: input.entityName || input.name,
          slug,
          fund_type: input.fundType,
          country: input.country,
          created_by_user_id: userId,
          status: 'active',
          branding: {
            primaryColor: '#4f46e5',
            secondaryColor: '#7c3aed',
          },
        })
        .select()
        .single();

      if (!fundError && data) {
        fundData = data;
        break;
      }

      // Check if error is unique constraint violation on slug
      if (fundError?.code === '23505' && fundError?.message?.includes('slug')) {
        attempts++;
        // Generate a new unique slug with random suffix
        slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
      } else {
        // Different error - throw immediately
        throw new Error(`Failed to create fund: ${fundError?.message || 'Unknown error'}`);
      }
    }

    if (!fundData) {
      throw new Error('Failed to create fund: Could not generate unique slug after multiple attempts');
    }

    // Update user with fund_id and onboarding_completed (use admin client)
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({
        fund_id: fundData.id,
        onboarding_completed: true,
      })
      .eq('id', userId);

    if (userError) {
      // Try to rollback fund creation
      await supabaseAdmin.from('funds').delete().eq('id', fundData.id);
      throw new Error(`Failed to update user: ${userError.message}`);
    }

    return {
      success: true,
      fund: {
        id: fundData.id as string,
        name: fundData.name as string,
        slug: fundData.slug as string,
        fundType: fundData.fund_type as string,
        country: fundData.country as string,
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

