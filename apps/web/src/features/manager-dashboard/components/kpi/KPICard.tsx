/**
 * KPI Card Component
 * Displays a single KPI with icon, value, and change indicator
 * Based on FundOverviewRow pattern from testing branch
 */

import { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  isLoading?: boolean;
  change?: number | null;
  changeLabel?: string;
  onClick?: () => void;
  className?: string;
}

export function KPICard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  isLoading = false,
  change,
  changeLabel = 'vs Last Period',
  onClick,
  className,
}: KPICardProps): JSX.Element {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 shadow-sm transition-shadow',
        onClick && 'cursor-pointer hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', iconBg)}>
          <Icon className={cn('h-4 w-4', iconColor)} />
        </div>
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
      </div>

      {isLoading ? (
        <Skeleton className="h-8 w-20 mb-1.5" />
      ) : (
        <p className="text-2xl font-bold tracking-tight mb-1">{value}</p>
      )}

      {change !== undefined && change !== null && !isLoading && (
        <div className="flex items-center gap-1 text-xs">
          <span
            className={cn('font-semibold', change >= 0 ? 'text-emerald-600' : 'text-red-500')}
          >
            {change >= 0 ? '+' : ''}
            {change.toFixed(1)}%
          </span>
          <span className="text-muted-foreground">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// KPI Card Grid Component
// ============================================
interface KPICardGridProps {
  children: React.ReactNode;
  columns?: 2 | 4 | 6 | 8;
  className?: string;
}

export function KPICardGrid({
  children,
  columns = 8,
  className,
}: KPICardGridProps): JSX.Element {
  const gridCols = {
    2: 'grid-cols-2',
    4: 'grid-cols-2 sm:grid-cols-4',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
    8: 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-8',
  };

  return (
    <div className={cn('grid gap-3', gridCols[columns], className)}>
      {children}
    </div>
  );
}

