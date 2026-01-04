import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts';

interface SparklineData {
  value: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  sparklineData?: SparklineData[];
  sparklineColor?: string;
  className?: string;
  size?: 'default' | 'large';
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  sparklineData,
  sparklineColor = '#6366f1',
  className,
  size = 'default',
}: MetricCardProps) {
  const isLarge = size === 'large';

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-lg',
        isLarge ? 'p-8' : 'p-6',
        className
      )}
    >
      {/* Background gradient effect */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse at top right, ${sparklineColor}10, transparent 50%)`,
        }}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className={cn(
            'font-medium text-muted-foreground',
            isLarge ? 'text-base' : 'text-sm'
          )}>
            {title}
          </p>
          <p className={cn(
            'mt-2 font-bold tracking-tight',
            isLarge ? 'text-4xl' : 'text-2xl'
          )}>
            {value}
          </p>
          {(trend || subtitle) && (
            <div className="mt-2 flex items-center gap-2">
              {trend && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                    trend.isPositive
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-red-500/10 text-red-500'
                  )}
                >
                  {trend.isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(trend.value)}%
                </span>
              )}
              {subtitle && (
                <span className="text-xs text-muted-foreground">{subtitle}</span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={cn(
              'flex items-center justify-center rounded-xl',
              isLarge ? 'h-14 w-14' : 'h-10 w-10'
            )}
            style={{ backgroundColor: `${sparklineColor}15` }}
          >
            <Icon
              className={cn(isLarge ? 'h-7 w-7' : 'h-5 w-5')}
              style={{ color: sparklineColor }}
            />
          </div>
        )}
      </div>

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <div className={cn('relative z-10', isLarge ? 'mt-6 h-20' : 'mt-4 h-12')}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id={`gradient-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparklineColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={sparklineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={sparklineColor}
                strokeWidth={2}
                fill={`url(#gradient-${title.replace(/\s/g, '')})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

