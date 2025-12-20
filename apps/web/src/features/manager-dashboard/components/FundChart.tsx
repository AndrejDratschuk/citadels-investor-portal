import { cn } from '@/lib/utils';

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface LineDataPoint {
  label: string;
  value: number;
}

interface FundChartProps {
  title: string;
  data: ChartDataPoint[] | LineDataPoint[];
  type?: 'bar' | 'donut' | 'line' | 'area';
  className?: string;
  showValues?: boolean;
  height?: number;
}

const defaultColors = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-purple-500',
  'bg-cyan-500',
];

const strokeColors = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#a855f7', // purple
  '#06b6d4', // cyan
];

export function FundChart({ 
  title, 
  data, 
  type = 'bar', 
  className,
  showValues = true,
  height = 200,
}: FundChartProps): JSX.Element {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));

  // Donut Chart
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
                    strokeWidth="3.5"
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                    className={cn(
                      'transition-all duration-300',
                      (item as ChartDataPoint).color || defaultColors[index % defaultColors.length].replace('bg-', 'text-')
                    )}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{total}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</span>
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
                      (item as ChartDataPoint).color || defaultColors[index % defaultColors.length]
                    )}
                  />
                  <span className="text-sm">{item.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold">{item.value}</span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({((item.value / total) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Line/Area Chart
  if (type === 'line' || type === 'area') {
    const padding = 40;
    const chartWidth = 300;
    const chartHeight = height - padding * 2;
    const range = maxValue - minValue || 1;
    
    const points = data.map((item, index) => {
      const x = padding + (index / (data.length - 1 || 1)) * (chartWidth - padding);
      const y = padding + chartHeight - ((item.value - minValue) / range) * chartHeight;
      return { x, y, ...item };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = type === 'area' 
      ? `${pathData} L ${points[points.length - 1].x} ${padding + chartHeight} L ${padding} ${padding + chartHeight} Z`
      : '';

    return (
      <div className={cn('rounded-xl border bg-card p-6', className)}>
        <h3 className="font-semibold">{title}</h3>
        <div className="mt-4">
          <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`} preserveAspectRatio="xMidYMid meet">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
              <line
                key={pct}
                x1={padding}
                y1={padding + chartHeight * (1 - pct)}
                x2={chartWidth - 10}
                y2={padding + chartHeight * (1 - pct)}
                stroke="currentColor"
                strokeOpacity={0.1}
                strokeDasharray="4 4"
              />
            ))}
            
            {/* Area fill */}
            {type === 'area' && (
              <path
                d={areaPath}
                fill="url(#areaGradient)"
                opacity={0.3}
              />
            )}
            
            {/* Line */}
            <path
              d={pathData}
              fill="none"
              stroke={strokeColors[0]}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Data points */}
            {points.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  fill={strokeColors[0]}
                  className="transition-all hover:r-6"
                />
                {/* Labels */}
                <text
                  x={p.x}
                  y={padding + chartHeight + 20}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {p.label}
                </text>
              </g>
            ))}
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColors[0]} stopOpacity={0.4} />
                <stop offset="100%" stopColor={strokeColors[0]} stopOpacity={0} />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    );
  }

  // Bar Chart (default)
  return (
    <div className={cn('rounded-xl border bg-card p-6', className)}>
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-4 space-y-3">
        {data.map((item, index) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="truncate pr-2">{item.label}</span>
              {showValues && (
                <span className="font-medium shrink-0">
                  ${(item.value / 1000000).toFixed(1)}M
                </span>
              )}
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  (item as ChartDataPoint).color || defaultColors[index % defaultColors.length]
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


