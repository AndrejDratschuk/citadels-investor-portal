import { cn } from '@/lib/utils';

interface GaugeChartProps {
  title: string;
  value: number;
  maxValue?: number;
  format?: 'percent' | 'currency' | 'number';
  color?: string;
  subtitle?: string;
  className?: string;
}

export function GaugeChart({
  title,
  value,
  maxValue = 100,
  format = 'percent',
  color = '#6366f1',
  subtitle,
  className,
}: GaugeChartProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference * 0.75; // 75% arc

  const formatValue = (): string => {
    switch (format) {
      case 'percent':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          notation: 'compact',
          maximumFractionDigits: 1,
        }).format(value);
      case 'number':
        return value.toLocaleString();
      default:
        return String(value);
    }
  };

  return (
    <div className={cn('rounded-2xl border bg-card p-6', className)}>
      <h3 className="text-center text-sm font-medium text-muted-foreground">
        {title}
      </h3>

      <div className="relative mx-auto mt-4 h-32 w-32">
        <svg
          className="h-full w-full -rotate-[135deg]"
          viewBox="0 0 100 100"
        >
          {/* Background arc */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-muted/30"
            strokeDasharray={`${circumference * 0.75} ${circumference}`}
          />
          {/* Value arc */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.75} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>
            {formatValue()}
          </span>
        </div>
      </div>

      {subtitle && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}

