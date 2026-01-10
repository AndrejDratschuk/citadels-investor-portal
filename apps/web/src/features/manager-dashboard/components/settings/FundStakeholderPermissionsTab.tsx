import { useState, useEffect, useCallback } from 'react';
import { Shield, RefreshCw, Loader2, Check, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  STAKEHOLDER_CATEGORIES,
  type StakeholderType,
  type StakeholderTypePermission,
} from '@altsui/shared';
import { api } from '@/lib/api/client';
import { CategorySection } from './CategorySection';

type CategoryKey = keyof typeof STAKEHOLDER_CATEGORIES;

export function FundStakeholderPermissionsTab(): JSX.Element {
  const [permissions, setPermissions] = useState<StakeholderTypePermission[]>([]);
  const [dirtyPermissions, setDirtyPermissions] = useState<Record<string, Partial<StakeholderTypePermission>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const hasPendingChanges = Object.keys(dirtyPermissions).length > 0;

  const fetchPermissions = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<StakeholderTypePermission[]>('/stakeholders/permissions');
      setPermissions(data);
      setDirtyPermissions({});
    } catch {
      setError('Failed to load permission settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const seedPermissions = async (): Promise<void> => {
    setSaving(true);
    try {
      const data = await api.post<StakeholderTypePermission[]>('/stakeholders/permissions/seed');
      setPermissions(data);
      setDirtyPermissions({});
    } catch {
      setError('Failed to create default permissions');
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionChange = (stakeholderType: StakeholderType, updates: Partial<StakeholderTypePermission>): void => {
    setPermissions((prev) =>
      prev.map((p) => (p.stakeholderType === stakeholderType ? { ...p, ...updates } : p))
    );
    setDirtyPermissions((prev) => ({
      ...prev,
      [stakeholderType]: { ...prev[stakeholderType], ...updates },
    }));
  };

  const saveAllChanges = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      const savePromises = Object.entries(dirtyPermissions).map(([type, updates]) =>
        api.put<StakeholderTypePermission>(`/stakeholders/permissions/${type}`, updates)
      );
      await Promise.all(savePromises);
      setDirtyPermissions({});
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Stakeholder Type Permissions</h2>
          <p className="text-sm text-muted-foreground">Configure what each stakeholder type can see and access</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchPermissions} disabled={loading}>
            <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
          {permissions.length === 0 && (
            <Button size="sm" onClick={seedPermissions} disabled={saving}>
              <Shield className="mr-2 h-4 w-4" />
              Initialize Defaults
            </Button>
          )}
          {hasPendingChanges && (
            <Button size="sm" onClick={saveAllChanges} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          )}
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {hasPendingChanges && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          You have unsaved changes. Click "Save Changes" to apply them.
        </div>
      )}

      {permissions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-medium">No Permission Configurations</h3>
          <p className="mt-2 text-sm text-muted-foreground">Click "Initialize Defaults" to create permission settings.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(['INVESTORS', 'SERVICE_PROVIDERS', 'TEAM'] as CategoryKey[]).map((cat) => (
            <CategorySection key={cat} category={cat} permissions={permissions} onUpdate={handlePermissionChange} isSaving={saving} />
          ))}
        </div>
      )}

      {saved && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white shadow-lg">
          <Check className="h-4 w-4" />
          <span className="text-sm font-medium">Saved</span>
        </div>
      )}
    </div>
  );
}
