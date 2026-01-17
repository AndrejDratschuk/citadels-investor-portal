/**
 * Stakeholder Roles Repository
 * Infrastructure layer - handles all DB operations for roles and permissions
 */

import { supabaseAdmin } from '../../common/database/supabase';
import type {
  StakeholderRole,
  RolePermission,
  DealPermissionOverride,
  PermissionGrant,
  StakeholderType,
  PermissionType,
  RoleType,
} from '@altsui/shared';

// ============================================
// DB Row Types
// ============================================

interface RoleDbRow {
  id: string;
  fund_id: string;
  role_name: string;
  role_type: RoleType;
  base_stakeholder_type: StakeholderType | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface PermissionDbRow {
  id: string;
  role_id: string;
  permission_path: string;
  permission_type: PermissionType;
  is_granted: boolean;
  created_at: string;
  updated_at: string;
}

interface OverrideDbRow {
  id: string;
  role_id: string;
  deal_id: string;
  permission_path: string;
  permission_type: PermissionType;
  is_granted: boolean;
  created_at: string;
}

// ============================================
// Formatters
// ============================================

function formatRole(row: RoleDbRow): StakeholderRole {
  return {
    id: row.id,
    fundId: row.fund_id,
    roleName: row.role_name,
    roleType: row.role_type,
    baseStakeholderType: row.base_stakeholder_type,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatPermission(row: PermissionDbRow): RolePermission {
  return {
    id: row.id,
    roleId: row.role_id,
    permissionPath: row.permission_path,
    permissionType: row.permission_type,
    isGranted: row.is_granted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatOverride(row: OverrideDbRow): DealPermissionOverride {
  return {
    id: row.id,
    roleId: row.role_id,
    dealId: row.deal_id,
    permissionPath: row.permission_path,
    permissionType: row.permission_type,
    isGranted: row.is_granted,
    createdAt: row.created_at,
  };
}

// ============================================
// Repository Class
// ============================================

export class StakeholderRolesRepository {
  // ----------------------------------------
  // Role Operations
  // ----------------------------------------

  async findAllRolesByFundId(fundId: string): Promise<StakeholderRole[]> {
    const { data, error } = await supabaseAdmin
      .from('stakeholder_roles')
      .select('*')
      .eq('fund_id', fundId)
      .order('role_type')
      .order('role_name');

    if (error) {
      throw new Error(`Failed to fetch roles: ${error.message}`);
    }

    return (data || []).map((row) => formatRole(row as RoleDbRow));
  }

  async findRoleById(roleId: string): Promise<StakeholderRole | null> {
    const { data, error } = await supabaseAdmin
      .from('stakeholder_roles')
      .select('*')
      .eq('id', roleId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch role: ${error.message}`);
    }

    return data ? formatRole(data as RoleDbRow) : null;
  }

  async findRoleByFundAndType(
    fundId: string,
    stakeholderType: StakeholderType
  ): Promise<StakeholderRole | null> {
    const { data, error } = await supabaseAdmin
      .from('stakeholder_roles')
      .select('*')
      .eq('fund_id', fundId)
      .eq('base_stakeholder_type', stakeholderType)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch role by type: ${error.message}`);
    }

    return data ? formatRole(data as RoleDbRow) : null;
  }

  async createRole(
    fundId: string,
    roleName: string,
    roleType: RoleType = 'custom',
    baseStakeholderType?: StakeholderType
  ): Promise<StakeholderRole> {
    const { data, error } = await supabaseAdmin
      .from('stakeholder_roles')
      .insert({
        fund_id: fundId,
        role_name: roleName,
        role_type: roleType,
        base_stakeholder_type: baseStakeholderType || null,
        is_default: false,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create role: ${error?.message}`);
    }

    return formatRole(data as RoleDbRow);
  }

  async updateRole(roleId: string, roleName: string): Promise<StakeholderRole> {
    const { data, error } = await supabaseAdmin
      .from('stakeholder_roles')
      .update({ role_name: roleName })
      .eq('id', roleId)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to update role: ${error?.message}`);
    }

    return formatRole(data as RoleDbRow);
  }

  async deleteRole(roleId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('stakeholder_roles')
      .delete()
      .eq('id', roleId);

    if (error) {
      throw new Error(`Failed to delete role: ${error.message}`);
    }
  }

  // ----------------------------------------
  // Permission Operations
  // ----------------------------------------

  async findPermissionsByRoleId(roleId: string): Promise<RolePermission[]> {
    const { data, error } = await supabaseAdmin
      .from('role_permissions')
      .select('*')
      .eq('role_id', roleId)
      .order('permission_path');

    if (error) {
      throw new Error(`Failed to fetch permissions: ${error.message}`);
    }

    return (data || []).map((row) => formatPermission(row as PermissionDbRow));
  }

  async findPermission(
    roleId: string,
    path: string,
    type: PermissionType
  ): Promise<RolePermission | null> {
    const { data, error } = await supabaseAdmin
      .from('role_permissions')
      .select('*')
      .eq('role_id', roleId)
      .eq('permission_path', path)
      .eq('permission_type', type)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch permission: ${error.message}`);
    }

    return data ? formatPermission(data as PermissionDbRow) : null;
  }

  async upsertPermission(
    roleId: string,
    path: string,
    type: PermissionType,
    granted: boolean
  ): Promise<RolePermission> {
    const { data, error } = await supabaseAdmin
      .from('role_permissions')
      .upsert(
        {
          role_id: roleId,
          permission_path: path,
          permission_type: type,
          is_granted: granted,
        },
        { onConflict: 'role_id,permission_path,permission_type' }
      )
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to upsert permission: ${error?.message}`);
    }

    return formatPermission(data as PermissionDbRow);
  }

  async bulkUpsertPermissions(
    roleId: string,
    permissions: PermissionGrant[]
  ): Promise<void> {
    const rows = permissions.map((p) => ({
      role_id: roleId,
      permission_path: p.path,
      permission_type: p.type,
      is_granted: p.granted,
    }));

    const { error } = await supabaseAdmin
      .from('role_permissions')
      .upsert(rows, { onConflict: 'role_id,permission_path,permission_type' });

    if (error) {
      throw new Error(`Failed to bulk upsert permissions: ${error.message}`);
    }
  }

  async deletePermission(
    roleId: string,
    path: string,
    type: PermissionType
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)
      .eq('permission_path', path)
      .eq('permission_type', type);

    if (error) {
      throw new Error(`Failed to delete permission: ${error.message}`);
    }
  }

  async deleteAllPermissions(roleId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);

    if (error) {
      throw new Error(`Failed to delete permissions: ${error.message}`);
    }
  }

  async copyPermissions(sourceRoleId: string, targetRoleId: string): Promise<void> {
    // Delete existing permissions on target
    await this.deleteAllPermissions(targetRoleId);

    // Fetch source permissions
    const sourcePermissions = await this.findPermissionsByRoleId(sourceRoleId);

    if (sourcePermissions.length === 0) {
      return;
    }

    // Insert copied permissions
    const rows = sourcePermissions.map((p) => ({
      role_id: targetRoleId,
      permission_path: p.permissionPath,
      permission_type: p.permissionType,
      is_granted: p.isGranted,
    }));

    const { error } = await supabaseAdmin
      .from('role_permissions')
      .insert(rows);

    if (error) {
      throw new Error(`Failed to copy permissions: ${error.message}`);
    }
  }

  // ----------------------------------------
  // Deal Override Operations
  // ----------------------------------------

  async findOverridesByRoleAndDeal(
    roleId: string,
    dealId: string
  ): Promise<DealPermissionOverride[]> {
    const { data, error } = await supabaseAdmin
      .from('deal_permission_overrides')
      .select('*')
      .eq('role_id', roleId)
      .eq('deal_id', dealId)
      .order('permission_path');

    if (error) {
      throw new Error(`Failed to fetch overrides: ${error.message}`);
    }

    return (data || []).map((row) => formatOverride(row as OverrideDbRow));
  }

  async findOverride(
    roleId: string,
    dealId: string,
    path: string,
    type: PermissionType
  ): Promise<DealPermissionOverride | null> {
    const { data, error } = await supabaseAdmin
      .from('deal_permission_overrides')
      .select('*')
      .eq('role_id', roleId)
      .eq('deal_id', dealId)
      .eq('permission_path', path)
      .eq('permission_type', type)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch override: ${error.message}`);
    }

    return data ? formatOverride(data as OverrideDbRow) : null;
  }

  async upsertOverride(
    roleId: string,
    dealId: string,
    path: string,
    type: PermissionType,
    granted: boolean
  ): Promise<DealPermissionOverride> {
    const { data, error } = await supabaseAdmin
      .from('deal_permission_overrides')
      .upsert(
        {
          role_id: roleId,
          deal_id: dealId,
          permission_path: path,
          permission_type: type,
          is_granted: granted,
        },
        { onConflict: 'role_id,deal_id,permission_path,permission_type' }
      )
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to upsert override: ${error?.message}`);
    }

    return formatOverride(data as OverrideDbRow);
  }

  async bulkUpsertOverrides(
    roleId: string,
    dealId: string,
    permissions: PermissionGrant[]
  ): Promise<void> {
    const rows = permissions.map((p) => ({
      role_id: roleId,
      deal_id: dealId,
      permission_path: p.path,
      permission_type: p.type,
      is_granted: p.granted,
    }));

    const { error } = await supabaseAdmin
      .from('deal_permission_overrides')
      .upsert(rows, { onConflict: 'role_id,deal_id,permission_path,permission_type' });

    if (error) {
      throw new Error(`Failed to bulk upsert overrides: ${error.message}`);
    }
  }

  async deleteOverride(
    roleId: string,
    dealId: string,
    path: string,
    type: PermissionType
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('deal_permission_overrides')
      .delete()
      .eq('role_id', roleId)
      .eq('deal_id', dealId)
      .eq('permission_path', path)
      .eq('permission_type', type);

    if (error) {
      throw new Error(`Failed to delete override: ${error.message}`);
    }
  }

  async deleteAllOverridesForDeal(roleId: string, dealId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('deal_permission_overrides')
      .delete()
      .eq('role_id', roleId)
      .eq('deal_id', dealId);

    if (error) {
      throw new Error(`Failed to delete overrides: ${error.message}`);
    }
  }

  // ----------------------------------------
  // User/Investor Role Lookup
  // ----------------------------------------

  async getUserRoleId(userId: string): Promise<string | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('role_id')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.role_id;
  }

  async getInvestorRoleId(investorId: string): Promise<string | null> {
    const { data, error } = await supabaseAdmin
      .from('investors')
      .select('role_id')
      .eq('id', investorId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.role_id;
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ role_id: roleId })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to assign role to user: ${error.message}`);
    }
  }

  async assignRoleToInvestor(investorId: string, roleId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('investors')
      .update({ role_id: roleId })
      .eq('id', investorId);

    if (error) {
      throw new Error(`Failed to assign role to investor: ${error.message}`);
    }
  }
}

export const stakeholderRolesRepository = new StakeholderRolesRepository();

