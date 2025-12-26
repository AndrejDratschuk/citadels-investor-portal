/**
 * KPI Trend Chart Component
 * SVG area chart for displaying KPI trends over time
 * Based on DealsRow pattern from testing branch
 */

import { useState } from 'react';
import { TrendingUp, MoreHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================
interface DataPoint {
  date: string;
  label: string;
  actual: number | null;
  forecast?: number | null;
  budget?: number | null;
}

interface KPITrendChartProps {
  title: string;
  data: DataPoint[];
  isLoading?: boolean;
  format?: 'currency' | 'percentage' | 'number';
  showForecast?: boolean;
  showBudget?: boolean;
  className?: string;
  onMoreClick?: () => void;
}

// ============================================
// Helper Functions
// ============================================
function formatValue(value: number, format: string): string {
  switch (format) {
    case 'currency':
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
      return `$${value.toFixed(0)}`;
    case 'percentage':
      return `${(value * 100).toFixed(1)}%`;
    default:
      return value.toLocaleString();
  }
}

// ============================================
// Component
// ============================================
export function KPITrendChart({
  title,
  data,
  isLoading = false,
  format = 'currency',
  showForecast = false,
  showBudget = false,
  className,
  onMoreClick,
}: KPITrendChartProps): JSX.Element {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // SVG dimensions
  const width = 600;
  const height = 200;
  const padding = { top: 30, right: 30, bottom: 35, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Filter out null values and calculate bounds
  const validData = data.filter((d) => d.actual !== null);
  const allValues = validData.flatMap((d) => {
    const vals = [d.actual!];
    if (showForecast && d.forecast !== null && d.forecast !== undefined) vals.push(d.forecast);
    if (showBudget && d.budget !== null && d.budget !== undefined) vals.push(d.budget);
    return vals;
  });

  const minValue = Math.min(...allValues) * 0.9;
  const maxValue = Math.max(...allValues) * 1.05;
  const range = maxValue - minValue || 1;

  // Calculate point positions
  const points = validData.map((d, i) => ({
    x: padding.left + (i / Math.max(validData.length - 1, 1)) * chartWidth,
    y: padding.top + chartHeight - ((d.actual! - minValue) / range) * chartHeight,
    ...d,
    index: i,
  }));

  // Generate path strings
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1]?.x || padding.left} ${
    padding.top + chartHeight
  } L ${padding.left} ${padding.top + chartHeight} Z`;

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;
  const prevValue =
    hoveredIndex !== null && hoveredIndex > 0 ? validData[hoveredIndex - 1].actual : null;
  const changePercent =
    hoveredPoint && prevValue !== null
      ? (((hoveredPoint.actual! - prevValue) / prevValue) * 100).toFixed(1)
      : null;

  if (isLoading) {
    return (
      <div className={cn('rounded-xl border bg-card p-5 shadow-sm', className)}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (validData.length === 0) {
    return (
      <div className={cn('rounded-xl border bg-card p-5 shadow-sm', className)}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">{title}</h2>
          </div>
        </div>
        <div className="flex items-center justify-center h-[200px] text-muted-foreground">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border bg-card p-5 shadow-sm', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">{title}</h2>
        </div>
        {onMoreClick && (
          <button
            onClick={onMoreClick}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
          >
            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="relative">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
            <line
              key={pct}
              x1={padding.left}
              y1={padding.top + chartHeight * (1 - pct)}
              x2={width - padding.right}
              y2={padding.top + chartHeight * (1 - pct)}
              stroke="currentColor"
              strokeOpacity={0.06}
              strokeDasharray="4 4"
            />
          ))}

          {/* Y-axis labels */}
          {[0, 0.5, 1].map((pct) => (
            <text
              key={pct}
              x={padding.left - 10}
              y={padding.top + chartHeight * (1 - pct) + 4}
              textAnchor="end"
              className="fill-muted-foreground text-[11px]"
            >
              {formatValue(minValue + range * pct, format)}
            </text>
          ))}

          {/* Area gradient */}
          <defs>
            <linearGradient id="kpiGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path d={areaPath} fill="url(#kpiGradient)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#6366f1"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Vertical hover line */}
          {hoveredPoint && (
            <line
              x1={hoveredPoint.x}
              y1={padding.top}
              x2={hoveredPoint.x}
              y2={padding.top + chartHeight}
              stroke="#6366f1"
              strokeOpacity={0.3}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          )}

          {/* Data points */}
          {points.map((p, i) => (
            <g key={i}>
              {/* Invisible hit area */}
              <circle
                cx={p.x}
                cy={p.y}
                r={20}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
                style={{ cursor: 'pointer' }}
              />
              {/* Visible point */}
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? 6 : 4}
                fill={hoveredIndex === i ? '#6366f1' : 'white'}
                stroke="#6366f1"
                strokeWidth={2}
                className="transition-all duration-150"
              />
            </g>
          ))}

          {/* X-axis labels */}
          {points.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={height - 10}
              textAnchor="middle"
              className={cn(
                'text-[11px] transition-colors',
                hoveredIndex === i ? 'fill-foreground font-medium' : 'fill-muted-foreground'
              )}
            >
              {p.label}
            </text>
          ))}

          {/* Hover tooltip */}
          {hoveredPoint && (
            <g
              transform={`translate(${
                hoveredPoint.x > width - 120 ? hoveredPoint.x - 115 : hoveredPoint.x + 15
              }, ${hoveredPoint.y < 60 ? hoveredPoint.y + 10 : hoveredPoint.y - 55})`}
            >
              <rect
                x="0"
                y="0"
                width="100"
                height="45"
                rx="8"
                fill="white"
                stroke="#e5e7eb"
                strokeWidth="1"
                filter="drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))"
              />
              <text x="10" y="18" className="fill-muted-foreground text-[10px]">
                {hoveredPoint.label}
              </text>
              <text x="10" y="35" className="fill-foreground text-sm font-bold">
                {formatValue(hoveredPoint.actual!, format)}
              </text>
              {changePercent && (
                <text
                  x="60"
                  y="35"
                  className={cn(
                    'text-[10px] font-semibold',
                    parseFloat(changePercent) >= 0 ? 'fill-emerald-600' : 'fill-red-500'
                  )}
                >
                  {parseFloat(changePercent) >= 0 ? '↗' : '↘'} {Math.abs(parseFloat(changePercent))}%
                </text>
              )}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

