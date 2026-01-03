import { useState, useEffect, useCallback } from 'react';
import { Shield, Save, RefreshCw, Loader2, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  INVESTOR_TYPE,
  INVESTOR_TYPE_LABELS,
  KPI_DETAIL_LEVEL,
  type InvestorType,
  type KpiDetailLevel,
  type InvestorTypePermission,
} from '@altsui/shared';
import { apiClient } from '@/lib/api/client';

const INVESTOR_TYPES = Object.values(INVESTOR_TYPE) as InvestorType[];
const KPI_LEVELS = Object.values(KPI_DETAIL_LEVEL) as KpiDetailLevel[];

const KPI_LEVEL_LABELS: Record<KpiDetailLevel, string> = {
  summary: 'Summary Only',
  detailed: 'Detailed',
  full: 'Full Access',
};

interface PermissionRowProps {
  permission: InvestorTypePermission;
  onUpdate: (investorType: InvestorType, updates: Partial<InvestorTypePermission>) => void;
  isSaving: boolean;
}

function PermissionRow({ permission, onUpdate, isSaving }: PermissionRowProps) {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = (field: keyof InvestorTypePermission, value: boolean) => {
    onUpdate(permission.investorType, { [field]: value });
  };

  const handleKpiLevelChange = (level: KpiDetailLevel) => {
    onUpdate(permission.investorType, { kpiDetailLevel: level });
  };

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{INVESTOR_TYPE_LABELS[permission.investorType]}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            KPI: {KPI_LEVEL_LABELS[permission.kpiDetailLevel]}
          </span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
        </div>
      </button>

      {expanded && (
        <div className="border-t p-4 space-y-4 bg-muted/20">
          {/* Dashboard Access */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Dashboard Access
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <PermissionToggle
                label="Detailed Financials"
                description="Full financial KPIs and metrics"
                checked={permission.canViewDetailedFinancials}
                onChange={(v) => handleToggle('canViewDetailedFinancials', v)}
                disabled={isSaving}
              />
              <PermissionToggle
                label="Outliers Dashboard"
                description="KPI outliers and exceptions"
                checked={permission.canViewOutliers}
                onChange={(v) => handleToggle('canViewOutliers', v)}
                disabled={isSaving}
              />
              <PermissionToggle
                label="View Other Investors"
                description="See other investor information"
                checked={permission.canViewOtherInvestors}
                onChange={(v) => handleToggle('canViewOtherInvestors', v)}
                disabled={isSaving}
              />
              <PermissionToggle
                label="Pipeline Access"
                description="View prospect pipeline"
                checked={permission.canViewPipeline}
                onChange={(v) => handleToggle('canViewPipeline', v)}
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Document Access */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Document Access
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <PermissionToggle
                label="Fund Documents"
                description="PPM, reports, etc."
                checked={permission.canViewFundDocuments}
                onChange={(v) => handleToggle('canViewFundDocuments', v)}
                disabled={isSaving}
              />
              <PermissionToggle
                label="Deal Documents"
                description="Deal-specific documents"
                checked={permission.canViewDealDocuments}
                onChange={(v) => handleToggle('canViewDealDocuments', v)}
                disabled={isSaving}
              />
              <PermissionToggle
                label="Other Investor Docs"
                description="Documents of other investors"
                checked={permission.canViewOtherInvestorDocs}
                onChange={(v) => handleToggle('canViewOtherInvestorDocs', v)}
                disabled={isSaving}
              />
              <PermissionToggle
                label="All Communications"
                description="View all fund communications"
                checked={permission.canViewAllCommunications}
                onChange={(v) => handleToggle('canViewAllCommunications', v)}
                disabled={isSaving}
              />
            </div>
          </div>

          {/* KPI Detail Level */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              KPI Detail Level
            </h4>
            <div className="flex flex-wrap gap-2">
              {KPI_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => handleKpiLevelChange(level)}
                  disabled={isSaving}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    permission.kpiDetailLevel === level
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  {KPI_LEVEL_LABELS[level]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface PermissionToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function PermissionToggle({ label, description, checked, onChange, disabled }: PermissionToggleProps) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-lg border bg-background hover:bg-muted/30 cursor-pointer transition-colors">
      <div className="relative flex h-5 w-9 items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="peer sr-only"
        />
        <div className={cn(
          'h-5 w-9 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-muted-foreground/30'
        )} />
        <div className={cn(
          'absolute left-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
          checked && 'translate-x-4'
        )} />
      </div>
      <div className="flex-1">
        <span className="text-sm font-medium">{label}</span>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </label>
  );
}

export function FundPermissionsTab() {
  const [permissions, setPermissions] = useState<InvestorTypePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedTypes, setSavedTypes] = useState<Set<InvestorType>>(new Set());

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{ success: boolean; data: InvestorTypePermission[] }>(
        '/investors/permissions'
      );
      if (response.success && response.data) {
        setPermissions(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
      setError('Failed to load permission settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const seedPermissions = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await apiClient.post<{ success: boolean; data: InvestorTypePermission[] }>(
        '/investors/permissions/seed'
      );
      if (response.success && response.data) {
        setPermissions(response.data);
      }
    } catch (err) {
      console.error('Failed to seed permissions:', err);
      setError('Failed to create default permissions');
    } finally {
      setSaving(false);
    }
  };

  const updatePermission = async (investorType: InvestorType, updates: Partial<InvestorTypePermission>) => {
    setSaving(true);
    setError(null);
    try {
      const response = await apiClient.put<{ success: boolean; data: InvestorTypePermission }>(
        `/investors/permissions/${investorType}`,
        updates
      );
      if (response.success && response.data) {
        setPermissions((prev) =>
          prev.map((p) => (p.investorType === investorType ? response.data : p))
        );
        setSavedTypes((prev) => new Set(prev).add(investorType));
        setTimeout(() => {
          setSavedTypes((prev) => {
            const next = new Set(prev);
            next.delete(investorType);
            return next;
          });
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to update permission:', err);
      setError('Failed to update permission');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Ensure all investor types have a permission config
  const permissionsMap = new Map(permissions.map((p) => [p.investorType, p]));
  const missingTypes = INVESTOR_TYPES.filter((type) => !permissionsMap.has(type));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Investor Type Permissions</h2>
          <p className="text-sm text-muted-foreground">
            Configure what each investor type can see and access
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchPermissions} disabled={loading}>
            <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
          {(permissions.length === 0 || missingTypes.length > 0) && (
            <Button size="sm" onClick={seedPermissions} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Shield className="mr-2 h-4 w-4" />
              )}
              Initialize Defaults
            </Button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Empty State */}
      {permissions.length === 0 && !loading && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-medium">No Permission Configurations</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Click "Initialize Defaults" to create permission settings for all investor types.
          </p>
        </div>
      )}

      {/* Permission List */}
      {permissions.length > 0 && (
        <div className="space-y-3">
          {permissions.map((permission) => (
            <PermissionRow
              key={permission.id}
              permission={permission}
              onUpdate={updatePermission}
              isSaving={saving}
            />
          ))}
        </div>
      )}

      {/* Saved indicator */}
      {savedTypes.size > 0 && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white shadow-lg">
          <Check className="h-4 w-4" />
          <span className="text-sm font-medium">Saved</span>
        </div>
      )}
    </div>
  );
}

