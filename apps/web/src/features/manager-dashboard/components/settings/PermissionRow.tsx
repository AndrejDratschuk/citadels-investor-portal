import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  STAKEHOLDER_TYPE_LABELS,
  KPI_DETAIL_LEVEL,
  type StakeholderType,
  type KpiDetailLevel,
  type StakeholderTypePermission,
} from '@altsui/shared';
import { PermissionToggle } from './PermissionToggle';

const KPI_LEVELS = Object.values(KPI_DETAIL_LEVEL) as KpiDetailLevel[];

const KPI_LEVEL_LABELS: Record<KpiDetailLevel, string> = {
  summary: 'Summary Only',
  detailed: 'Detailed',
  full: 'Full Access',
};

interface PermissionRowProps {
  permission: StakeholderTypePermission;
  onUpdate: (type: StakeholderType, updates: Partial<StakeholderTypePermission>) => void;
  isSaving: boolean;
}

export function PermissionRow({ permission, onUpdate, isSaving }: PermissionRowProps): JSX.Element {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = (field: keyof StakeholderTypePermission, value: boolean): void => {
    onUpdate(permission.stakeholderType, { [field]: value });
  };

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium text-sm">{STAKEHOLDER_TYPE_LABELS[permission.stakeholderType]}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            KPI: {KPI_LEVEL_LABELS[permission.kpiDetailLevel]}
          </span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
        </div>
      </button>

      {expanded && (
        <div className="border-t p-4 space-y-4 bg-muted/20">
          <div className="grid gap-2 sm:grid-cols-2">
            <PermissionToggle
              label="Detailed Financials"
              checked={permission.canViewDetailedFinancials}
              onChange={(v) => handleToggle('canViewDetailedFinancials', v)}
              disabled={isSaving}
            />
            <PermissionToggle
              label="Outliers Dashboard"
              checked={permission.canViewOutliers}
              onChange={(v) => handleToggle('canViewOutliers', v)}
              disabled={isSaving}
            />
            <PermissionToggle
              label="View Other Investors"
              checked={permission.canViewOtherInvestors}
              onChange={(v) => handleToggle('canViewOtherInvestors', v)}
              disabled={isSaving}
            />
            <PermissionToggle
              label="Pipeline Access"
              checked={permission.canViewPipeline}
              onChange={(v) => handleToggle('canViewPipeline', v)}
              disabled={isSaving}
            />
            <PermissionToggle
              label="Fund Documents"
              checked={permission.canViewFundDocuments}
              onChange={(v) => handleToggle('canViewFundDocuments', v)}
              disabled={isSaving}
            />
            <PermissionToggle
              label="Deal Documents"
              checked={permission.canViewDealDocuments}
              onChange={(v) => handleToggle('canViewDealDocuments', v)}
              disabled={isSaving}
            />
            <PermissionToggle
              label="Other Investor Docs"
              checked={permission.canViewOtherInvestorDocs}
              onChange={(v) => handleToggle('canViewOtherInvestorDocs', v)}
              disabled={isSaving}
            />
            <PermissionToggle
              label="All Communications"
              checked={permission.canViewAllCommunications}
              onChange={(v) => handleToggle('canViewAllCommunications', v)}
              disabled={isSaving}
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {KPI_LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => onUpdate(permission.stakeholderType, { kpiDetailLevel: level })}
                disabled={isSaving}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-medium transition-colors',
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
      )}
    </div>
  );
}

