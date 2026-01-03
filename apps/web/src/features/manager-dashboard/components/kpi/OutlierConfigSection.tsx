/**
 * Outlier Configuration Section
 * Allows fund managers to configure outlier detection thresholds per KPI
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Settings2,
  RotateCcw,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { outliersApi, kpiDefinitionsApi } from '@/lib/api/kpis';
import { cn } from '@/lib/utils';
import type {
  KpiDefinition,
  KpiOutlierConfig,
  OutlierComparisonBaseline,
} from '@altsui/shared';
import { DEFAULT_INVERSE_METRIC_CODES } from '@altsui/shared';

// ============================================
// Baseline Options
// ============================================
const BASELINE_OPTIONS: { value: OutlierComparisonBaseline; label: string }[] = [
  { value: 'forecast', label: 'Forecast' },
  { value: 'budget', label: 'Budget' },
  { value: 'last_period', label: 'Last Period' },
];

// ============================================
// Component
// ============================================
export function OutlierConfigSection(): JSX.Element {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<
    Map<string, Partial<KpiOutlierConfig>>
  >(new Map());

  // Fetch KPI definitions
  const { data: definitions, isLoading: isDefsLoading } = useQuery({
    queryKey: ['kpi-definitions'],
    queryFn: kpiDefinitionsApi.getAll,
  });

  // Fetch current outlier configs
  const { data: configs, isLoading: isConfigsLoading } = useQuery({
    queryKey: ['outlier-config'],
    queryFn: outliersApi.getConfig,
  });

  // Save config mutation
  const saveMutation = useMutation({
    mutationFn: outliersApi.updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlier-config'] });
      setPendingChanges(new Map());
    },
  });

  const isLoading = isDefsLoading || isConfigsLoading;
  const configsMap = new Map((configs || []).map((c) => [c.kpiId, c]));
  const hasChanges = pendingChanges.size > 0;

  // Get effective value for a field
  const getEffectiveValue = <K extends keyof KpiOutlierConfig>(
    kpiId: string,
    field: K,
    defaultValue: KpiOutlierConfig[K]
  ): KpiOutlierConfig[K] => {
    const pending = pendingChanges.get(kpiId);
    if (pending && field in pending) {
      return pending[field] as KpiOutlierConfig[K];
    }
    const saved = configsMap.get(kpiId);
    if (saved && field in saved) {
      return saved[field];
    }
    return defaultValue;
  };

  // Handle field change
  const handleChange = (
    kpiId: string,
    field: keyof KpiOutlierConfig,
    value: unknown
  ): void => {
    setPendingChanges((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(kpiId) || {};
      newMap.set(kpiId, { ...existing, [field]: value });
      return newMap;
    });
  };

  // Handle save
  const handleSave = (): void => {
    const updates = Array.from(pendingChanges.entries()).map(([kpiId, changes]) => ({
      kpiId,
      ...changes,
    }));
    saveMutation.mutate(updates);
  };

  // Handle reset
  const handleReset = (): void => {
    setPendingChanges(new Map());
  };

  // Check if KPI is inverse by default
  const isDefaultInverse = (code: string): boolean => {
    return DEFAULT_INVERSE_METRIC_CODES.includes(code);
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Outliers Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Configure thresholds for KPI variance detection
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t">
          {/* Action Bar */}
          {hasChanges && (
            <div className="flex items-center justify-end gap-2 px-4 py-2 bg-muted/50 border-b">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}

          {/* KPI Config List */}
          {!isLoading && definitions && (
            <div className="divide-y max-h-[400px] overflow-y-auto">
              {definitions.slice(0, 15).map((def) => (
                <KpiOutlierConfigRow
                  key={def.id}
                  definition={def}
                  alertThreshold={getEffectiveValue(def.id, 'alertThreshold', 20)}
                  comparisonBaseline={getEffectiveValue(def.id, 'comparisonBaseline', 'forecast')}
                  isInverseMetric={getEffectiveValue(
                    def.id,
                    'isInverseMetric',
                    isDefaultInverse(def.code)
                  )}
                  enabledInOutliers={getEffectiveValue(def.id, 'enabledInOutliers', true)}
                  onChange={(field, value) => handleChange(def.id, field, value)}
                />
              ))}
            </div>
          )}

          {/* Info Footer */}
          <div className="px-4 py-3 bg-muted/30 border-t">
            <p className="text-xs text-muted-foreground">
              <Settings2 className="h-3 w-3 inline mr-1" />
              Thresholds determine when a KPI appears in the Outliers dashboard. 
              Default: 20% variance from baseline.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Individual KPI Config Row
// ============================================
interface KpiOutlierConfigRowProps {
  definition: KpiDefinition;
  alertThreshold: number;
  comparisonBaseline: OutlierComparisonBaseline;
  isInverseMetric: boolean;
  enabledInOutliers: boolean;
  onChange: (field: keyof KpiOutlierConfig, value: unknown) => void;
}

function KpiOutlierConfigRow({
  definition,
  alertThreshold,
  comparisonBaseline,
  isInverseMetric,
  enabledInOutliers,
  onChange,
}: KpiOutlierConfigRowProps): JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center gap-4 px-4 py-3 text-sm',
        !enabledInOutliers && 'opacity-50'
      )}
    >
      {/* KPI Name */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{definition.name}</p>
      </div>

      {/* Threshold Input */}
      <div className="flex items-center gap-1 w-20">
        <Input
          type="number"
          min={1}
          max={100}
          value={alertThreshold}
          onChange={(e) => onChange('alertThreshold', Number(e.target.value))}
          className="h-8 text-center"
        />
        <span className="text-muted-foreground">%</span>
      </div>

      {/* Baseline Select */}
      <select
        value={comparisonBaseline}
        onChange={(e) =>
          onChange('comparisonBaseline', e.target.value as OutlierComparisonBaseline)
        }
        className="h-8 px-2 rounded-md border bg-background text-sm w-28"
      >
        {BASELINE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Inverse Toggle */}
      <Button
        variant={isInverseMetric ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('isInverseMetric', !isInverseMetric)}
        className="w-20 h-8"
      >
        {isInverseMetric ? 'Inverse' : 'Normal'}
      </Button>

      {/* Enabled Toggle */}
      <Button
        variant={enabledInOutliers ? 'outline' : 'ghost'}
        size="sm"
        onClick={() => onChange('enabledInOutliers', !enabledInOutliers)}
        className="w-8 h-8 p-0"
      >
        {enabledInOutliers ? '✓' : '—'}
      </Button>
    </div>
  );
}

export default OutlierConfigSection;

