import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
              trend.isPositive
                ? 'bg-green-50 text-green-600'
                : 'bg-red-50 text-red-600'
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
