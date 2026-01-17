/**
 * Stakeholder Permission Schemas
 * Zod validation for API boundary validation
 */

import { z } from 'zod';
import { STAKEHOLDER_TYPE } from '../constants/stakeholderType.constants';
import { PERMISSION_TYPES, ROLE_TYPES } from '../constants/permissionTree.constants';

// ============================================
// Base Schemas
// ============================================

/** Stakeholder type validation */
export const stakeholderTypeSchema = z.enum(
  Object.values(STAKEHOLDER_TYPE) as [string, ...string[]]
);

/** Permission type validation */
export const permissionTypeSchema = z.enum(PERMISSION_TYPES);

/** Role type validation */
export const roleTypeSchema = z.enum(ROLE_TYPES);

// ============================================
// Role Schemas
// ============================================

/** Schema for creating a new role */
export const createRoleSchema = z.object({
  roleName: z.string().min(1, 'Role name is required').max(100),
  copyFromRoleId: z.string().uuid().optional(),
  baseStakeholderType: stakeholderTypeSchema.optional(),
});

/** Schema for updating a role */
export const updateRoleSchema = z.object({
  roleName: z.string().min(1).max(100).optional(),
});

/** Schema for role ID param */
export const roleIdParamSchema = z.object({
  roleId: z.string().uuid(),
});

// ============================================
// Permission Schemas
// ============================================

/** Schema for a single permission grant */
export const permissionGrantSchema = z.object({
  path: z.string().min(1),
  type: permissionTypeSchema,
  granted: z.boolean(),
});

/** Schema for batch permission update */
export const permissionUpdateSchema = z.object({
  permissions: z.array(permissionGrantSchema).min(1),
});

/** Schema for copying permissions between roles */
export const copyPermissionsParamSchema = z.object({
  roleId: z.string().uuid(),
  sourceRoleId: z.string().uuid(),
});

// ============================================
// Deal Override Schemas
// ============================================

/** Schema for deal override params */
export const dealOverrideParamSchema = z.object({
  roleId: z.string().uuid(),
  dealId: z.string().uuid(),
});

/** Schema for setting deal overrides */
export const dealOverrideSchema = z.object({
  permissions: z.array(permissionGrantSchema),
});

// ============================================
// Permission Check Schemas
// ============================================

/** Schema for checking a permission */
export const checkPermissionSchema = z.object({
  path: z.string().min(1),
  type: permissionTypeSchema.optional().default('view'),
  dealId: z.string().uuid().optional(),
});

// ============================================
// Inferred Types (non-conflicting only)
// Types that conflict with stakeholderPermission.types.ts are omitted here.
// Use the explicit interfaces from that file instead.
// ============================================

export type RoleIdParam = z.infer<typeof roleIdParamSchema>;
export type CopyPermissionsParam = z.infer<typeof copyPermissionsParamSchema>;
export type DealOverrideParam = z.infer<typeof dealOverrideParamSchema>;
export type CheckPermissionInput = z.infer<typeof checkPermissionSchema>;
