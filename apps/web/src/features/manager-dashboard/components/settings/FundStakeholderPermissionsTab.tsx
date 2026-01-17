import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  RefreshCw,
  Loader2,
  Check,
  Save,
  Plus,
  Copy,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';
import { PermissionTreeAccordion } from './PermissionTreeAccordion';
import { CreateRoleModal } from './CreateRoleModal';
import { CopyRoleModal } from './CopyRoleModal';
import type {
  StakeholderRole,
  RolePermissionsResponse,
  PermissionGrant,
  StakeholderType,
} from '@altsui/shared';

export function FundStakeholderPermissionsTab(): JSX.Element {
  // State
  const [roles, setRoles] = useState<StakeholderRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<RolePermissionsResponse | null>(null);
  const [pendingPermissions, setPendingPermissions] = useState<PermissionGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);

  const hasPendingChanges = pendingPermissions.length > 0;
  const selectedRole = roles.find((r) => r.id === selectedRoleId) || null;

  // Fetch all roles
  const fetchRoles = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<StakeholderRole[]>('/stakeholders/roles');
      setRoles(data);
      
      // Auto-select first role if none selected
      if (data.length > 0 && !selectedRoleId) {
        setSelectedRoleId(data[0].id);
      }
    } catch {
      setError('Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, [selectedRoleId]);

  // Fetch permissions for selected role
  const fetchRolePermissions = useCallback(async (roleId: string): Promise<void> => {
    try {
      const data = await api.get<RolePermissionsResponse>(
        `/stakeholders/roles/${roleId}/permissions`
      );
      setRolePermissions(data);
      setPendingPermissions([]);
    } catch {
      setError('Failed to load permissions');
    }
  }, []);

  // Initialize roles for fund
  const initializeRoles = async (): Promise<void> => {
    setSaving(true);
    try {
      const data = await api.post<StakeholderRole[]>('/stakeholders/initialize');
      setRoles(data);
      if (data.length > 0) {
        setSelectedRoleId(data[0].id);
      }
    } catch {
      setError('Failed to initialize roles');
    } finally {
      setSaving(false);
    }
  };

  // Create new role
  const handleCreateRole = async (
    roleName: string,
    copyFromRoleId?: string,
    baseStakeholderType?: StakeholderType
  ): Promise<void> => {
    const data = await api.post<StakeholderRole>('/stakeholders/roles', {
      roleName,
      copyFromRoleId,
      baseStakeholderType,
    });
    setRoles((prev) => [...prev, data]);
    setSelectedRoleId(data.id);
  };

  // Delete role
  const handleDeleteRole = async (): Promise<void> => {
    if (!selectedRole || selectedRole.roleType === 'system') return;
    
    if (!confirm(`Are you sure you want to delete "${selectedRole.roleName}"?`)) {
      return;
    }

    setSaving(true);
    try {
      await api.delete(`/stakeholders/roles/${selectedRole.id}`);
      setRoles((prev) => prev.filter((r) => r.id !== selectedRole.id));
      setSelectedRoleId(roles[0]?.id || null);
      setRolePermissions(null);
    } catch {
      setError('Failed to delete role');
    } finally {
      setSaving(false);
    }
  };

  // Copy permissions from another role
  const handleCopyPermissions = async (sourceRoleId: string): Promise<void> => {
    if (!selectedRoleId) return;
    
    await api.post<RolePermissionsResponse>(
      `/stakeholders/roles/${selectedRoleId}/copy-from/${sourceRoleId}`
    );
    await fetchRolePermissions(selectedRoleId);
  };

  // Reset role to defaults
  const handleResetToDefaults = async (): Promise<void> => {
    if (!selectedRoleId) return;
    
    if (!confirm('Reset permissions to defaults? This cannot be undone.')) {
      return;
    }

    setSaving(true);
    try {
      const data = await api.post<RolePermissionsResponse>(
        `/stakeholders/roles/${selectedRoleId}/reset-defaults`
      );
      setRolePermissions(data);
      setPendingPermissions([]);
    } catch {
      setError('Failed to reset permissions');
    } finally {
      setSaving(false);
    }
  };

  // Handle permission changes in the tree
  const handlePermissionsChange = (permissions: PermissionGrant[]): void => {
    setPendingPermissions(permissions);
  };

  // Save all pending changes
  const saveAllChanges = async (): Promise<void> => {
    if (!selectedRoleId || pendingPermissions.length === 0) return;

    setSaving(true);
    setError(null);
    try {
      const data = await api.put<RolePermissionsResponse>(
        `/stakeholders/roles/${selectedRoleId}/permissions`,
        { permissions: pendingPermissions }
      );
      setRolePermissions(data);
      setPendingPermissions([]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Effect: Fetch roles on mount
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Effect: Fetch permissions when role changes
  useEffect(() => {
    if (selectedRoleId) {
      fetchRolePermissions(selectedRoleId);
    }
  }, [selectedRoleId, fetchRolePermissions]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No roles state
  if (roles.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Stakeholder Permissions</h2>
            <p className="text-sm text-muted-foreground">
              Configure what each stakeholder type can see and access
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-dashed p-8 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-medium">No Roles Configured</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Click "Initialize Roles" to create default stakeholder roles.
          </p>
          <Button className="mt-4" onClick={initializeRoles} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Shield className="mr-2 h-4 w-4" />
            )}
            Initialize Roles
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Stakeholder Permissions</h2>
          <p className="text-sm text-muted-foreground">
            Configure what each stakeholder type can see and access
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchRoles} disabled={loading}>
            <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Unsaved changes warning */}
      {hasPendingChanges && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-700 dark:text-amber-300">
          You have unsaved changes. Click "Save Changes" to apply them.
        </div>
      )}

      {/* Role selector and actions */}
      <div className="flex flex-wrap items-center gap-3 p-4 border rounded-lg bg-muted/30">
        {/* Role dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="roleSelect" className="text-sm font-medium whitespace-nowrap">
            Select Role:
          </label>
          <select
            id="roleSelect"
            value={selectedRoleId || ''}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            disabled={saving}
            className="px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[200px]"
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.roleName}
                {role.roleType === 'custom' ? ' (Custom)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            disabled={saving}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Create Role
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCopyModal(true)}
            disabled={saving || !selectedRoleId}
          >
            <Copy className="mr-1.5 h-4 w-4" />
            Copy From...
          </Button>
          {selectedRole?.roleType === 'custom' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteRole}
              disabled={saving}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Permission tree */}
      {rolePermissions && (
        <div className="space-y-4">
          <PermissionTreeAccordion
            permissions={
              pendingPermissions.length > 0
                ? pendingPermissions
                : rolePermissions.permissions
            }
            onChange={handlePermissionsChange}
            disabled={saving}
          />

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button onClick={saveAllChanges} disabled={saving || !hasPendingChanges}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={handleResetToDefaults}
              disabled={saving}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
            {hasPendingChanges && (
              <Button
                variant="ghost"
                onClick={() => {
                  setPendingPermissions([]);
                  if (selectedRoleId) {
                    fetchRolePermissions(selectedRoleId);
                  }
                }}
                disabled={saving}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateRoleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateRole}
        existingRoles={roles}
        isLoading={saving}
      />

      <CopyRoleModal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        onSubmit={handleCopyPermissions}
        targetRole={selectedRole}
        availableRoles={roles}
        isLoading={saving}
      />

      {/* Saved toast */}
      {saved && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white shadow-lg">
          <Check className="h-4 w-4" />
          <span className="text-sm font-medium">Saved</span>
        </div>
      )}
    </div>
  );
}
