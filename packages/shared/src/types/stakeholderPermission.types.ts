/**
 * Stakeholder Permission Types
 * Types for hierarchical role-based permissions system
 */

import type { StakeholderType } from '../constants/stakeholderType.constants';
import type { PermissionType, RoleType, PermissionTreeState } from '../constants/permissionTree.constants';

// ============================================
// Stakeholder Role
// ============================================

/** A stakeholder role that can be assigned to users/investors */
export interface StakeholderRole {
  id: string;
  fundId: string;
  roleName: string;
  roleType: RoleType;
  baseStakeholderType: StakeholderType | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Input for creating a new role */
export interface CreateRoleInput {
  roleName: string;
  copyFromRoleId?: string;
  baseStakeholderType?: StakeholderType;
}

/** Input for updating a role */
export interface UpdateRoleInput {
  roleName?: string;
}

// ============================================
// Role Permission
// ============================================

/** A single permission entry for a role */
export interface RolePermission {
  id: string;
  roleId: string;
  permissionPath: string;
  permissionType: PermissionType;
  isGranted: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Permission entry without metadata (for API responses) */
export interface PermissionGrant {
  path: string;
  type: PermissionType;
  granted: boolean;
}

/** Batch permission update input */
export interface PermissionUpdateInput {
  permissions: PermissionGrant[];
}

// ============================================
// Deal Permission Override
// ============================================

/** Deal-specific permission override */
export interface DealPermissionOverride {
  id: string;
  roleId: string;
  dealId: string;
  permissionPath: string;
  permissionType: PermissionType;
  isGranted: boolean;
  createdAt: string;
}

/** Input for setting deal overrides */
export interface DealOverrideInput {
  permissions: PermissionGrant[];
}

// ============================================
// Permission Tree State (for UI)
// ============================================

/** State of a single node in the permission tree */
export interface PermissionNodeState {
  path: string;
  label: string;
  permissions: {
    [type in PermissionType]?: {
      granted: boolean;
      inherited: boolean;
      effectiveValue: boolean;
    };
  };
  expanded: boolean;
  children?: PermissionNodeState[];
}

/** Check state for tri-state checkbox */
export type CheckState = 'checked' | 'unchecked' | 'indeterminate';

/** Compute the check state from children */
export function computeCheckState(children: boolean[]): CheckState {
  if (children.length === 0) return 'unchecked';
  const allChecked = children.every((c) => c);
  const allUnchecked = children.every((c) => !c);
  if (allChecked) return 'checked';
  if (allUnchecked) return 'unchecked';
  return 'indeterminate';
}

// ============================================
// API Response Types
// ============================================

/** Response for getting role permissions */
export interface RolePermissionsResponse {
  roleId: string;
  roleName: string;
  roleType: RoleType;
  baseStakeholderType: StakeholderType | null;
  permissions: PermissionGrant[];
}

/** Response for listing all roles */
export interface RolesListResponse {
  roles: StakeholderRole[];
}

/** Response for checking a specific permission */
export interface PermissionCheckResponse {
  path: string;
  type: PermissionType;
  granted: boolean;
  source: 'explicit' | 'inherited' | 'deal_override' | 'default';
}

// ============================================
// Effective Permissions (resolved for a user)
// ============================================

/** Resolved permissions for a user/investor */
export interface EffectivePermissions {
  roleId: string;
  roleName: string;
  permissions: PermissionTreeState;
}

/** Helper to check if a permission is granted in a tree state */
export function hasPermissionInState(
  state: PermissionTreeState,
  path: string,
  type: PermissionType = 'view'
): boolean {
  // Check exact path
  if (state[path]?.[type] !== undefined) {
    return state[path][type] === true;
  }
  
  // Walk up the path tree for inheritance
  const parts = path.split('.');
  for (let i = parts.length - 1; i >= 1; i--) {
    const parentPath = parts.slice(0, i).join('.');
    if (state[parentPath]?.[type] !== undefined) {
      return state[parentPath][type] === true;
    }
  }
  
  // Default to false
  return false;
}
