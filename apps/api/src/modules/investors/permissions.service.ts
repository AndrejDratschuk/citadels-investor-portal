/**
 * Investor Type Permissions Service
 * Manages permission configurations for different investor types within a fund
 */

import { supabaseAdmin } from '../../common/database/supabase';
import type {
  InvestorType,
  KpiDetailLevel,
  InvestorTypePermission,
  InvestorPermissions,
} from '@altsui/shared';

/** Database row shape for investor_type_permissions table */
interface PermissionDbRow {
  id: string;
  fund_id: string;
  investor_type: string;
  can_view_detailed_financials: boolean;
  can_view_outliers: boolean;
  can_view_other_investors: boolean;
  can_view_pipeline: boolean;
  can_view_fund_documents: boolean;
  can_view_deal_documents: boolean;
  can_view_other_investor_docs: boolean;
  can_view_all_communications: boolean;
  kpi_detail_level: string;
  created_at: string;
  updated_at: string;
}

/** Input for updating permission configuration */
interface PermissionUpdateInput {
  canViewDetailedFinancials?: boolean;
  canViewOutliers?: boolean;
  canViewOtherInvestors?: boolean;
  canViewPipeline?: boolean;
  canViewFundDocuments?: boolean;
  canViewDealDocuments?: boolean;
  canViewOtherInvestorDocs?: boolean;
  canViewAllCommunications?: boolean;
  kpiDetailLevel?: KpiDetailLevel;
}

/** Default permissions by investor type */
const DEFAULT_PERMISSIONS: Record<InvestorType, Omit<PermissionUpdateInput, 'kpiDetailLevel'> & { kpiDetailLevel: KpiDetailLevel }> = {
  limited_partner: {
    canViewDetailedFinancials: false,
    canViewOutliers: false,
    canViewOtherInvestors: false,
    canViewPipeline: false,
    canViewFundDocuments: true,
    canViewDealDocuments: true,
    canViewOtherInvestorDocs: false,
    canViewAllCommunications: false,
    kpiDetailLevel: 'summary',
  },
  general_partner: {
    canViewDetailedFinancials: true,
    canViewOutliers: true,
    canViewOtherInvestors: false,
    canViewPipeline: false,
    canViewFundDocuments: true,
    canViewDealDocuments: true,
    canViewOtherInvestorDocs: false,
    canViewAllCommunications: false,
    kpiDetailLevel: 'detailed',
  },
  series_a: {
    canViewDetailedFinancials: false,
    canViewOutliers: false,
    canViewOtherInvestors: false,
    canViewPipeline: false,
    canViewFundDocuments: true,
    canViewDealDocuments: true,
    canViewOtherInvestorDocs: false,
    canViewAllCommunications: false,
    kpiDetailLevel: 'summary',
  },
  series_b: {
    canViewDetailedFinancials: false,
    canViewOutliers: false,
    canViewOtherInvestors: false,
    canViewPipeline: false,
    canViewFundDocuments: true,
    canViewDealDocuments: true,
    canViewOtherInvestorDocs: false,
    canViewAllCommunications: false,
    kpiDetailLevel: 'summary',
  },
  series_c: {
    canViewDetailedFinancials: false,
    canViewOutliers: false,
    canViewOtherInvestors: false,
    canViewPipeline: false,
    canViewFundDocuments: true,
    canViewDealDocuments: true,
    canViewOtherInvestorDocs: false,
    canViewAllCommunications: false,
    kpiDetailLevel: 'summary',
  },
  institutional: {
    canViewDetailedFinancials: true,
    canViewOutliers: true,
    canViewOtherInvestors: false,
    canViewPipeline: false,
    canViewFundDocuments: true,
    canViewDealDocuments: true,
    canViewOtherInvestorDocs: false,
    canViewAllCommunications: false,
    kpiDetailLevel: 'detailed',
  },
  individual_accredited: {
    canViewDetailedFinancials: false,
    canViewOutliers: false,
    canViewOtherInvestors: false,
    canViewPipeline: false,
    canViewFundDocuments: true,
    canViewDealDocuments: true,
    canViewOtherInvestorDocs: false,
    canViewAllCommunications: false,
    kpiDetailLevel: 'summary',
  },
  family_office: {
    canViewDetailedFinancials: true,
    canViewOutliers: true,
    canViewOtherInvestors: false,
    canViewPipeline: false,
    canViewFundDocuments: true,
    canViewDealDocuments: true,
    canViewOtherInvestorDocs: false,
    canViewAllCommunications: false,
    kpiDetailLevel: 'detailed',
  },
  custom: {
    canViewDetailedFinancials: false,
    canViewOutliers: false,
    canViewOtherInvestors: false,
    canViewPipeline: false,
    canViewFundDocuments: true,
    canViewDealDocuments: true,
    canViewOtherInvestorDocs: false,
    canViewAllCommunications: false,
    kpiDetailLevel: 'summary',
  },
};

export class InvestorPermissionsService {
  /**
   * Get all permission configurations for a fund
   */
  async getAllPermissionsForFund(fundId: string): Promise<InvestorTypePermission[]> {
    const { data, error } = await supabaseAdmin
      .from('investor_type_permissions')
      .select('*')
      .eq('fund_id', fundId)
      .order('investor_type');

    if (error) {
      console.error('[PermissionsService] Error fetching permissions:', error);
      throw new Error('Failed to fetch investor type permissions');
    }

    return (data || []).map((row) => this.formatPermission(row as PermissionDbRow));
  }

  /**
   * Get permission configuration for a specific investor type in a fund
   */
  async getPermissionsForType(fundId: string, investorType: InvestorType): Promise<InvestorTypePermission | null> {
    const { data, error } = await supabaseAdmin
      .from('investor_type_permissions')
      .select('*')
      .eq('fund_id', fundId)
      .eq('investor_type', investorType)
      .maybeSingle();

    if (error) {
      console.error('[PermissionsService] Error fetching permission:', error);
      throw new Error('Failed to fetch investor type permission');
    }

    if (!data) {
      return null;
    }

    return this.formatPermission(data as PermissionDbRow);
  }

  /**
   * Get effective permissions for an investor based on their type
   * Falls back to defaults if no custom configuration exists
   */
  async getPermissionsForInvestor(investorId: string): Promise<InvestorPermissions> {
    // First get the investor to find their type and fund
    const { data: investor, error: investorError } = await supabaseAdmin
      .from('investors')
      .select('fund_id, investor_type')
      .eq('id', investorId)
      .single();

    if (investorError || !investor) {
      console.error('[PermissionsService] Error fetching investor:', investorError);
      throw new Error('Investor not found');
    }

    const investorType = (investor.investor_type || 'limited_partner') as InvestorType;
    const fundId = investor.fund_id;

    // Try to get fund-specific permissions
    const customPermission = await this.getPermissionsForType(fundId, investorType);

    if (customPermission) {
      return {
        investorType,
        canViewDetailedFinancials: customPermission.canViewDetailedFinancials,
        canViewOutliers: customPermission.canViewOutliers,
        canViewOtherInvestors: customPermission.canViewOtherInvestors,
        canViewPipeline: customPermission.canViewPipeline,
        canViewFundDocuments: customPermission.canViewFundDocuments,
        canViewDealDocuments: customPermission.canViewDealDocuments,
        canViewOtherInvestorDocs: customPermission.canViewOtherInvestorDocs,
        canViewAllCommunications: customPermission.canViewAllCommunications,
        kpiDetailLevel: customPermission.kpiDetailLevel,
      };
    }

    // Fall back to default permissions for this investor type
    const defaults = DEFAULT_PERMISSIONS[investorType] || DEFAULT_PERMISSIONS.limited_partner;
    return {
      investorType,
      canViewDetailedFinancials: defaults.canViewDetailedFinancials ?? false,
      canViewOutliers: defaults.canViewOutliers ?? false,
      canViewOtherInvestors: defaults.canViewOtherInvestors ?? false,
      canViewPipeline: defaults.canViewPipeline ?? false,
      canViewFundDocuments: defaults.canViewFundDocuments ?? true,
      canViewDealDocuments: defaults.canViewDealDocuments ?? true,
      canViewOtherInvestorDocs: defaults.canViewOtherInvestorDocs ?? false,
      canViewAllCommunications: defaults.canViewAllCommunications ?? false,
      kpiDetailLevel: defaults.kpiDetailLevel ?? 'summary',
    };
  }

  /**
   * Update permission configuration for an investor type in a fund
   * Creates the record if it doesn't exist (upsert)
   */
  async updatePermissions(
    fundId: string,
    investorType: InvestorType,
    updates: PermissionUpdateInput
  ): Promise<InvestorTypePermission> {
    const updateRow: Record<string, unknown> = {
      fund_id: fundId,
      investor_type: investorType,
      updated_at: new Date().toISOString(),
    };

    if (updates.canViewDetailedFinancials !== undefined) {
      updateRow.can_view_detailed_financials = updates.canViewDetailedFinancials;
    }
    if (updates.canViewOutliers !== undefined) {
      updateRow.can_view_outliers = updates.canViewOutliers;
    }
    if (updates.canViewOtherInvestors !== undefined) {
      updateRow.can_view_other_investors = updates.canViewOtherInvestors;
    }
    if (updates.canViewPipeline !== undefined) {
      updateRow.can_view_pipeline = updates.canViewPipeline;
    }
    if (updates.canViewFundDocuments !== undefined) {
      updateRow.can_view_fund_documents = updates.canViewFundDocuments;
    }
    if (updates.canViewDealDocuments !== undefined) {
      updateRow.can_view_deal_documents = updates.canViewDealDocuments;
    }
    if (updates.canViewOtherInvestorDocs !== undefined) {
      updateRow.can_view_other_investor_docs = updates.canViewOtherInvestorDocs;
    }
    if (updates.canViewAllCommunications !== undefined) {
      updateRow.can_view_all_communications = updates.canViewAllCommunications;
    }
    if (updates.kpiDetailLevel !== undefined) {
      updateRow.kpi_detail_level = updates.kpiDetailLevel;
    }

    const { data, error } = await supabaseAdmin
      .from('investor_type_permissions')
      .upsert(updateRow, { onConflict: 'fund_id,investor_type' })
      .select('*')
      .single();

    if (error || !data) {
      console.error('[PermissionsService] Error updating permissions:', error);
      throw new Error('Failed to update investor type permissions');
    }

    return this.formatPermission(data as PermissionDbRow);
  }

  /**
   * Seed default permissions for a new fund
   * Called when a fund is created
   */
  async seedDefaultPermissions(fundId: string): Promise<void> {
    const investorTypes = Object.keys(DEFAULT_PERMISSIONS) as InvestorType[];

    const rows = investorTypes.map((investorType) => {
      const defaults = DEFAULT_PERMISSIONS[investorType];
      return {
        fund_id: fundId,
        investor_type: investorType,
        can_view_detailed_financials: defaults.canViewDetailedFinancials,
        can_view_outliers: defaults.canViewOutliers,
        can_view_other_investors: defaults.canViewOtherInvestors,
        can_view_pipeline: defaults.canViewPipeline,
        can_view_fund_documents: defaults.canViewFundDocuments,
        can_view_deal_documents: defaults.canViewDealDocuments,
        can_view_other_investor_docs: defaults.canViewOtherInvestorDocs,
        can_view_all_communications: defaults.canViewAllCommunications,
        kpi_detail_level: defaults.kpiDetailLevel,
      };
    });

    const { error } = await supabaseAdmin
      .from('investor_type_permissions')
      .upsert(rows, { onConflict: 'fund_id,investor_type' });

    if (error) {
      console.error('[PermissionsService] Error seeding permissions:', error);
      throw new Error('Failed to seed default permissions');
    }
  }

  /**
   * Get default permissions for an investor type (static, no DB lookup)
   */
  getDefaultPermissions(investorType: InvestorType): InvestorPermissions {
    const defaults = DEFAULT_PERMISSIONS[investorType] || DEFAULT_PERMISSIONS.limited_partner;
    return {
      investorType,
      canViewDetailedFinancials: defaults.canViewDetailedFinancials ?? false,
      canViewOutliers: defaults.canViewOutliers ?? false,
      canViewOtherInvestors: defaults.canViewOtherInvestors ?? false,
      canViewPipeline: defaults.canViewPipeline ?? false,
      canViewFundDocuments: defaults.canViewFundDocuments ?? true,
      canViewDealDocuments: defaults.canViewDealDocuments ?? true,
      canViewOtherInvestorDocs: defaults.canViewOtherInvestorDocs ?? false,
      canViewAllCommunications: defaults.canViewAllCommunications ?? false,
      kpiDetailLevel: defaults.kpiDetailLevel ?? 'summary',
    };
  }

  private formatPermission(row: PermissionDbRow): InvestorTypePermission {
    return {
      id: row.id,
      fundId: row.fund_id,
      investorType: row.investor_type as InvestorType,
      canViewDetailedFinancials: row.can_view_detailed_financials,
      canViewOutliers: row.can_view_outliers,
      canViewOtherInvestors: row.can_view_other_investors,
      canViewPipeline: row.can_view_pipeline,
      canViewFundDocuments: row.can_view_fund_documents,
      canViewDealDocuments: row.can_view_deal_documents,
      canViewOtherInvestorDocs: row.can_view_other_investor_docs,
      canViewAllCommunications: row.can_view_all_communications,
      kpiDetailLevel: row.kpi_detail_level as KpiDetailLevel,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const investorPermissionsService = new InvestorPermissionsService();





