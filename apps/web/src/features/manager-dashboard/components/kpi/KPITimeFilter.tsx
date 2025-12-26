/**
 * KPI Time Filter Component
 * Tabs for switching between Actual, Forecast, and Budget views
 */

import { cn } from '@/lib/utils';
import type { KpiDataType } from '@flowveda/shared';

// ============================================
// Types
// ============================================
interface KPITimeFilterProps {
  selected: KpiDataType;
  onChange: (dataType: KpiDataType) => void;
  className?: string;
}

interface TabConfig {
  value: KpiDataType;
  label: string;
}

const TABS: TabConfig[] = [
  { value: 'actual', label: 'Actual' },
  { value: 'forecast', label: 'Forecast' },
  { value: 'budget', label: 'Budget' },
];

// ============================================
// Component
// ============================================
export function KPITimeFilter({
  selected,
  onChange,
  className,
}: KPITimeFilterProps): JSX.Element {
  return (
    <div className={cn('inline-flex rounded-lg border bg-muted p-1', className)}>
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-all',
            selected === tab.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ============================================
// Comparison Badge Component
// ============================================
interface KPIComparisonBadgeProps {
  actualValue: number;
  compareValue: number;
  compareLabel: string;
  format?: 'currency' | 'percentage' | 'number';
}

export function KPIComparisonBadge({
  actualValue,
  compareValue,
  compareLabel,
  format = 'percentage',
}: KPIComparisonBadgeProps): JSX.Element {
  const diff = actualValue - compareValue;
  const percentDiff = compareValue !== 0 ? (diff / compareValue) * 100 : 0;
  const isPositive = diff >= 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
      )}
    >
      {isPositive ? '+' : ''}
      {percentDiff.toFixed(1)}% {compareLabel}
    </span>
  );
}

