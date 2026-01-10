/**
 * Stakeholder Permissions Repository
 * Infrastructure layer - handles all DB operations
 */

import { supabaseAdmin } from '../../common/database/supabase';
import type { StakeholderType, StakeholderTypePermission, StakeholderPermissionUpdateInput } from '@altsui/shared';
import { formatPermissionRow, formatPermissionRows, type PermissionDbRow } from './formatPermissionRow';

export class StakeholderPermissionsRepository {
  /**
   * Fetch all permission configurations for a fund
   */
  async findAllByFundId(fundId: string): Promise<StakeholderTypePermission[]> {
    const { data, error } = await supabaseAdmin
      .from('stakeholder_type_permissions')
      .select('*')
      .eq('fund_id', fundId)
      .order('stakeholder_type');

    if (error) {
      throw new Error(`Failed to fetch stakeholder permissions: ${error.message}`);
    }

    return formatPermissionRows((data || []) as PermissionDbRow[]);
  }

  /**
   * Fetch permission for a specific stakeholder type in a fund
   */
  async findByFundAndType(
    fundId: string,
    stakeholderType: StakeholderType
  ): Promise<StakeholderTypePermission | null> {
    const { data, error } = await supabaseAdmin
      .from('stakeholder_type_permissions')
      .select('*')
      .eq('fund_id', fundId)
      .eq('stakeholder_type', stakeholderType)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch stakeholder permission: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return formatPermissionRow(data as PermissionDbRow);
  }

  /**
   * Upsert permission configuration for a stakeholder type
   */
  async upsert(
    fundId: string,
    stakeholderType: StakeholderType,
    updates: StakeholderPermissionUpdateInput
  ): Promise<StakeholderTypePermission> {
    const updateRow: Record<string, unknown> = {
      fund_id: fundId,
      stakeholder_type: stakeholderType,
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
      .from('stakeholder_type_permissions')
      .upsert(updateRow, { onConflict: 'fund_id,stakeholder_type' })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to upsert stakeholder permission: ${error?.message}`);
    }

    return formatPermissionRow(data as PermissionDbRow);
  }

  /**
   * Bulk insert permissions for a fund (used for seeding)
   */
  async bulkInsert(
    rows: Array<{
      fundId: string;
      stakeholderType: StakeholderType;
      permissions: StakeholderPermissionUpdateInput;
    }>
  ): Promise<void> {
    const dbRows = rows.map((row) => ({
      fund_id: row.fundId,
      stakeholder_type: row.stakeholderType,
      can_view_detailed_financials: row.permissions.canViewDetailedFinancials ?? false,
      can_view_outliers: row.permissions.canViewOutliers ?? false,
      can_view_other_investors: row.permissions.canViewOtherInvestors ?? false,
      can_view_pipeline: row.permissions.canViewPipeline ?? false,
      can_view_fund_documents: row.permissions.canViewFundDocuments ?? true,
      can_view_deal_documents: row.permissions.canViewDealDocuments ?? true,
      can_view_other_investor_docs: row.permissions.canViewOtherInvestorDocs ?? false,
      can_view_all_communications: row.permissions.canViewAllCommunications ?? false,
      kpi_detail_level: row.permissions.kpiDetailLevel ?? 'summary',
    }));

    const { error } = await supabaseAdmin
      .from('stakeholder_type_permissions')
      .upsert(dbRows, { onConflict: 'fund_id,stakeholder_type' });

    if (error) {
      throw new Error(`Failed to bulk insert stakeholder permissions: ${error.message}`);
    }
  }

  /**
   * Get user's stakeholder type from the users table
   */
  async getUserStakeholderType(userId: string): Promise<{ fundId: string; stakeholderType: StakeholderType | null }> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('fund_id, stakeholder_type')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw new Error(`Failed to fetch user stakeholder type: ${error?.message}`);
    }

    return {
      fundId: data.fund_id,
      stakeholderType: data.stakeholder_type as StakeholderType | null,
    };
  }

  /**
   * Get investor's type from the investors table
   */
  async getInvestorType(investorId: string): Promise<{ fundId: string; investorType: StakeholderType }> {
    const { data, error } = await supabaseAdmin
      .from('investors')
      .select('fund_id, investor_type')
      .eq('id', investorId)
      .single();

    if (error || !data) {
      throw new Error(`Failed to fetch investor type: ${error?.message}`);
    }

    return {
      fundId: data.fund_id,
      investorType: (data.investor_type || 'limited_partner') as StakeholderType,
    };
  }
}

export const stakeholderPermissionsRepository = new StakeholderPermissionsRepository();

