/**
 * Stakeholders Module
 * Exports for stakeholder permission management
 */

export { stakeholderPermissionsRoutes } from './stakeholderPermissions.routes';
export { stakeholderPermissionsService } from './stakeholderPermissions.service';
export { stakeholderPermissionsRepository } from './stakeholderPermissions.repository';
export { getDefaultStakeholderPermissions, getAllDefaultPermissions } from './getDefaultStakeholderPermissions';
export { formatPermissionRow, formatPermissionRows } from './formatPermissionRow';

