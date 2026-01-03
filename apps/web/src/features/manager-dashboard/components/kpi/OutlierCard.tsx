/**
 * Outlier Card Component
 * Displays a single KPI outlier with status color, variance, and values
 */

import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { KpiOutlier, OutlierStatus } from '@altsui/shared';
import { formatCurrency, formatPercentage } from '@altsui/shared';

// ============================================
// Status Configuration
// ============================================
const STATUS_STYLES: Record<OutlierStatus, { border: string; bg: string; text: string }> = {
  green: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
  },
  yellow: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
  },
  red: {
    border: 'border-l-red-500',
    bg: 'bg-red-50',
    text: 'text-red-700',
  },
};

const BASELINE_LABELS: Record<string, string> = {
  forecast: 'vs Forecast',
  budget: 'vs Budget',
  last_period: 'vs Last Period',
};

// ============================================
// Component Props
// ============================================
interface OutlierCardProps {
  outlier: KpiOutlier;
  dealId: string;
  rank?: number;
  className?: string;
}

// ============================================
// Formatting Helpers
// ============================================
function formatValue(value: number, format: string): string {
  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value);
    case 'ratio':
      return `${value.toFixed(2)}x`;
    default:
      return value.toLocaleString();
  }
}

// ============================================
// Component
// ============================================
export function OutlierCard({
  outlier,
  dealId,
  rank,
  className,
}: OutlierCardProps): JSX.Element {
  const navigate = useNavigate();
  const styles = STATUS_STYLES[outlier.status];
  const isPositive = outlier.variancePercent > 0;

  const handleViewCategory = (): void => {
    navigate(`/manager/deals/${dealId}/financials/category/${outlier.category}`);
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-l-4 bg-card p-4 shadow-sm transition-shadow hover:shadow-md',
        styles.border,
        className
      )}
    >
      {/* Header: Rank + KPI Name */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {rank !== undefined && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
              {rank}
            </span>
          )}
          <span className="font-semibold text-sm">{outlier.kpiName}</span>
        </div>
        <div className={cn('flex items-center gap-1 text-sm font-bold', styles.text)}>
          {isPositive ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          {isPositive ? '+' : ''}
          {outlier.variancePercent.toFixed(1)}%
        </div>
      </div>

      {/* Comparison Label */}
      <p className="text-xs text-muted-foreground mb-3">
        {BASELINE_LABELS[outlier.baselineType] || outlier.baselineType}
      </p>

      {/* Values */}
      <div className={cn('rounded-md p-2 text-xs space-y-1', styles.bg)}>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            {outlier.baselineType === 'forecast' ? 'Forecast' : 
             outlier.baselineType === 'budget' ? 'Budget' : 'Last Period'}:
          </span>
          <span className="font-medium">{formatValue(outlier.baselineValue, outlier.format)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Actual:</span>
          <span className="font-bold">{formatValue(outlier.actualValue, outlier.format)}</span>
        </div>
        <div className="flex justify-between border-t pt-1 mt-1">
          <span className="text-muted-foreground">Variance:</span>
          <span className={cn('font-bold', styles.text)}>
            {outlier.absoluteDifference >= 0 ? '+' : ''}
            {formatValue(outlier.absoluteDifference, outlier.format)}
          </span>
        </div>
      </div>

      {/* Action Button */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full mt-3 gap-1"
        onClick={handleViewCategory}
      >
        View Category
        <ExternalLink className="h-3 w-3" />
      </Button>
    </div>
  );
}

export default OutlierCard;

