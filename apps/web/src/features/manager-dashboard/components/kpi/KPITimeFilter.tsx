/**
 * KPI Time Filter Component
 * Tabs for switching between Actual, Forecast, Budget, and comparison views
 */

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KpiViewMode } from '@altsui/shared';

// ============================================
// Types
// ============================================
interface KPIViewFilterProps {
  selected: KpiViewMode;
  onChange: (viewMode: KpiViewMode) => void;
  className?: string;
  showCompareOptions?: boolean;
}

interface TabConfig {
  value: KpiViewMode;
  label: string;
  isComparison?: boolean;
}

const PRIMARY_TABS: TabConfig[] = [
  { value: 'actual', label: 'Actual' },
  { value: 'forecast', label: 'Forecast' },
  { value: 'budget', label: 'Budget' },
];

const COMPARE_OPTIONS: TabConfig[] = [
  { value: 'vs_forecast', label: 'vs Forecast', isComparison: true },
  { value: 'vs_budget', label: 'vs Budget', isComparison: true },
  { value: 'vs_last_period', label: 'vs Last Period', isComparison: true },
];

// ============================================
// Component
// ============================================
export function KPIViewFilter({
  selected,
  onChange,
  className,
  showCompareOptions = true,
}: KPIViewFilterProps): JSX.Element {
  const [showDropdown, setShowDropdown] = useState(false);

  const isComparisonMode = selected.startsWith('vs_');
  const selectedCompare = COMPARE_OPTIONS.find(opt => opt.value === selected);

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {/* Primary View Tabs */}
      <div className="inline-flex rounded-lg border bg-muted p-1">
        {PRIMARY_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-all',
              selected === tab.value && !isComparisonMode
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Compare Dropdown */}
      {showCompareOptions && (
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={cn(
              'inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all',
              isComparisonMode
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {isComparisonMode ? selectedCompare?.label : 'Compare'}
            <ChevronDown className="h-4 w-4" />
          </button>

          {showDropdown && (
            <>
              {/* Backdrop to close dropdown */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowDropdown(false)}
              />
              
              {/* Dropdown menu */}
              <div className="absolute right-0 top-full mt-1 z-20 min-w-[140px] rounded-lg border bg-background shadow-lg">
                {COMPARE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setShowDropdown(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg',
                      selected === option.value
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
                
                {/* Clear comparison option */}
                {isComparisonMode && (
                  <>
                    <div className="border-t" />
                    <button
                      onClick={() => {
                        onChange('actual');
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-b-lg"
                    >
                      Clear comparison
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Legacy Component (for backward compatibility during migration)
// ============================================
interface KPITimeFilterProps {
  selected: 'actual' | 'forecast' | 'budget';
  onChange: (dataType: 'actual' | 'forecast' | 'budget') => void;
  className?: string;
}

export function KPITimeFilter({
  selected,
  onChange,
  className,
}: KPITimeFilterProps): JSX.Element {
  return (
    <div className={cn('inline-flex rounded-lg border bg-muted p-1', className)}>
      {PRIMARY_TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value as 'actual' | 'forecast' | 'budget')}
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
  isInverse?: boolean;
  isPercentageKpi?: boolean;
}

export function KPIComparisonBadge({
  actualValue,
  compareValue,
  compareLabel,
  isInverse = false,
  isPercentageKpi = false,
}: KPIComparisonBadgeProps): JSX.Element {
  const diff = actualValue - compareValue;
  const percentDiff = compareValue !== 0 ? (diff / compareValue) * 100 : 0;
  
  // For inverse metrics, flip the color interpretation
  const adjustedDiff = isInverse ? -percentDiff : percentDiff;

  // Determine status color
  const getStatusColor = (): string => {
    if (adjustedDiff >= 10) return 'bg-emerald-100 text-emerald-700';
    if (adjustedDiff >= 0) return 'bg-slate-100 text-slate-600';
    if (adjustedDiff >= -10) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  // Format display value
  const displayValue = isPercentageKpi
    ? `${diff >= 0 ? '+' : ''}${(diff * 100).toFixed(1)} pts`
    : `${percentDiff >= 0 ? '+' : ''}${percentDiff.toFixed(1)}%`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        getStatusColor()
      )}
    >
      {displayValue} {compareLabel}
    </span>
  );
}

// ============================================
// Variance Display Component
// ============================================
import type { KpiVariance } from '@altsui/shared';

interface VarianceBadgeProps {
  variance: KpiVariance | null;
  label: string;
  className?: string;
}

export function VarianceBadge({
  variance,
  label,
  className,
}: VarianceBadgeProps): JSX.Element | null {
  if (!variance) {
    return (
      <span className={cn('text-xs text-muted-foreground', className)}>
        {label}: N/A
      </span>
    );
  }

  const getStatusColor = (): string => {
    switch (variance.status) {
      case 'green': return 'text-emerald-600';
      case 'yellow': return 'text-amber-600';
      case 'red': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  const getStatusBg = (): string => {
    switch (variance.status) {
      case 'green': return 'bg-emerald-100';
      case 'yellow': return 'bg-amber-100';
      case 'red': return 'bg-red-100';
      default: return 'bg-slate-100';
    }
  };

  // Format the variance display
  const displayValue = variance.percent !== null
    ? `${variance.percent >= 0 ? '+' : ''}${variance.percent.toFixed(1)}%`
    : `${variance.amount >= 0 ? '+' : ''}${(variance.amount * 100).toFixed(1)} pts`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        getStatusBg(),
        getStatusColor(),
        className
      )}
    >
      {displayValue} {label}
    </span>
  );
}

