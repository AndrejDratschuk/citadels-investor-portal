import { cn } from '@/lib/utils';

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface FundChartProps {
  title: string;
  data: ChartDataPoint[];
  type?: 'bar' | 'donut';
  className?: string;
}

const defaultColors = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-purple-500',
  'bg-cyan-500',
];

export function FundChart({ title, data, type = 'bar', className }: FundChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const maxValue = Math.max(...data.map((d) => d.value));

  if (type === 'donut') {
    let cumulativePercent = 0;

    return (
      <div className={cn('rounded-xl border bg-card p-6', className)}>
        <h3 className="font-semibold">{title}</h3>
        <div className="mt-4 flex items-center gap-8">
          {/* Donut Chart */}
          <div className="relative h-32 w-32 shrink-0">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              {data.map((item, index) => {
                const percent = (item.value / total) * 100;
                const dashArray = `${percent} ${100 - percent}`;
                const dashOffset = -cumulativePercent;
                cumulativePercent += percent;

                return (
                  <circle
                    key={item.label}
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                    className={cn(
                      item.color || defaultColors[index % defaultColors.length].replace('bg-', 'text-')
                    )}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{data.length}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            {data.map((item, index) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-3 w-3 rounded-full',
                      item.color || defaultColors[index % defaultColors.length]
                    )}
                  />
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className="text-sm font-medium">
                  {((item.value / total) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Bar Chart
  return (
    <div className={cn('rounded-xl border bg-card p-6', className)}>
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-4 space-y-3">
        {data.map((item, index) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>{item.label}</span>
              <span className="font-medium">${(item.value / 1000000).toFixed(1)}M</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  item.color || defaultColors[index % defaultColors.length]
                )}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


