/**
 * KPI Comparison Card Component
 * Displays a KPI with actual value and variance against baseline (forecast/budget)
 */

import { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { VarianceBadge } from './KPITimeFilter';
import type { KpiCardDataWithDimensions, KpiViewMode, KpiVariance } from '@altsui/shared';
import { formatCurrency, formatPercentage } from '@altsui/shared';

// ============================================
// Types
// ============================================
interface KPIComparisonCardProps {
  kpi: KpiCardDataWithDimensions;
  viewMode: KpiViewMode;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
}

// ============================================
// Helper Functions
// ============================================
function formatValue(value: number | null, format: string): string {
  if (value === null) return '—';

  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value);
    case 'ratio':
      return `${value.toFixed(2)}x`;
    case 'number':
    default:
      return value.toLocaleString();
  }
}

function getDisplayValue(
  kpi: KpiCardDataWithDimensions,
  viewMode: KpiViewMode
): { primary: string; secondary: string | null; variance: KpiVariance | null; label: string } {
  switch (viewMode) {
    case 'actual':
      return {
        primary: formatValue(kpi.actualValue, kpi.format),
        secondary: null,
        variance: kpi.vsLastPeriod,
        label: 'vs Last Period',
      };

    case 'forecast':
      return {
        primary: formatValue(kpi.forecastValue, kpi.format),
        secondary: null,
        variance: null,
        label: 'Forecast',
      };

    case 'budget':
      return {
        primary: formatValue(kpi.budgetValue, kpi.format),
        secondary: null,
        variance: null,
        label: 'Budget',
      };

    case 'vs_forecast':
      return {
        primary: formatValue(kpi.actualValue, kpi.format),
        secondary: formatValue(kpi.forecastValue, kpi.format),
        variance: kpi.vsForecast,
        label: 'vs Forecast',
      };

    case 'vs_budget':
      return {
        primary: formatValue(kpi.actualValue, kpi.format),
        secondary: formatValue(kpi.budgetValue, kpi.format),
        variance: kpi.vsBudget,
        label: 'vs Budget',
      };

    case 'vs_last_period':
      return {
        primary: formatValue(kpi.actualValue, kpi.format),
        secondary: formatValue(kpi.previousPeriodValue, kpi.format),
        variance: kpi.vsLastPeriod,
        label: 'vs Last Period',
      };

    default:
      return {
        primary: formatValue(kpi.actualValue, kpi.format),
        secondary: null,
        variance: null,
        label: '',
      };
  }
}

// ============================================
// Component
// ============================================
export function KPIComparisonCard({
  kpi,
  viewMode,
  icon: Icon,
  iconColor,
  iconBg,
  isLoading = false,
  onClick,
  className,
}: KPIComparisonCardProps): JSX.Element {
  const { primary, secondary, variance, label } = getDisplayValue(kpi, viewMode);
  const isComparisonMode = viewMode.startsWith('vs_');

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 shadow-sm transition-shadow',
        onClick && 'cursor-pointer hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', iconBg)}>
          <Icon className={cn('h-4 w-4', iconColor)} />
        </div>
        <span className="text-xs font-medium text-muted-foreground">{kpi.name}</span>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <>
          <Skeleton className="h-8 w-20 mb-1.5" />
          <Skeleton className="h-3 w-16" />
        </>
      ) : isComparisonMode ? (
        /* Comparison View */
        <>
          {/* Primary Value (Actual) */}
          <div className="flex items-baseline gap-2 mb-1">
            <p className="text-2xl font-bold tracking-tight">{primary}</p>
            {secondary !== '—' && (
              <span className="text-xs text-muted-foreground">
                vs {secondary}
              </span>
            )}
          </div>

          {/* Variance Badge */}
          {variance ? (
            <VarianceBadge variance={variance} label={label} />
          ) : secondary === '—' ? (
            <span className="text-xs text-muted-foreground">
              No {label.replace('vs ', '')} data
            </span>
          ) : null}
        </>
      ) : (
        /* Single Value View */
        <>
          <p className="text-2xl font-bold tracking-tight mb-1">{primary}</p>
          
          {/* Show change vs last period for non-comparison views */}
          {viewMode === 'actual' && kpi.change !== null && (
            <div className="flex items-center gap-1 text-xs">
              <span
                className={cn(
                  'font-semibold',
                  kpi.isInverseMetric
                    ? kpi.change <= 0 ? 'text-emerald-600' : 'text-red-500'
                    : kpi.change >= 0 ? 'text-emerald-600' : 'text-red-500'
                )}
              >
                {kpi.change >= 0 ? '+' : ''}{kpi.change.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">{label}</span>
            </div>
          )}

          {/* Label for forecast/budget views */}
          {(viewMode === 'forecast' || viewMode === 'budget') && (
            <span className="text-xs text-muted-foreground">{label}</span>
          )}
        </>
      )}
    </div>
  );
}

// ============================================
// Full Comparison Card (shows all three values)
// ============================================
interface KPIFullComparisonCardProps {
  kpi: KpiCardDataWithDimensions;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
}

export function KPIFullComparisonCard({
  kpi,
  icon: Icon,
  iconColor,
  iconBg,
  isLoading = false,
  onClick,
  className,
}: KPIFullComparisonCardProps): JSX.Element {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 shadow-sm transition-shadow',
        onClick && 'cursor-pointer hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', iconBg)}>
          <Icon className={cn('h-4 w-4', iconColor)} />
        </div>
        <span className="text-sm font-medium">{kpi.name}</span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      ) : (
        <div className="space-y-2">
          {/* Actual */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Actual</span>
            <span className="font-semibold">{formatValue(kpi.actualValue, kpi.format)}</span>
          </div>

          {/* Forecast with variance */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Forecast</span>
            <div className="flex items-center gap-2">
              <span className="text-sm">{formatValue(kpi.forecastValue, kpi.format)}</span>
              {kpi.vsForecast && (
                <VarianceBadge variance={kpi.vsForecast} label="" className="text-[10px]" />
              )}
            </div>
          </div>

          {/* Budget with variance */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Budget</span>
            <div className="flex items-center gap-2">
              <span className="text-sm">{formatValue(kpi.budgetValue, kpi.format)}</span>
              {kpi.vsBudget && (
                <VarianceBadge variance={kpi.vsBudget} label="" className="text-[10px]" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

