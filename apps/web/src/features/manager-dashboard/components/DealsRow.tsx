/**
 * Deals Row
 * Interactive portfolio performance chart with hover tooltips
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, MoreHorizontal } from 'lucide-react';
import type { DealsMetrics } from '@/lib/api/dashboard';
import { Skeleton } from '@/components/ui/skeleton';

interface DealsRowProps {
  deals: DealsMetrics | null;
  isLoading: boolean;
}

// Monthly portfolio value data
const monthlyData = [
  { month: 'Jan', value: 38.2, year: 2024 },
  { month: 'Feb', value: 39.5, year: 2024 },
  { month: 'Mar', value: 41.0, year: 2024 },
  { month: 'Apr', value: 42.8, year: 2024 },
  { month: 'May', value: 44.5, year: 2024 },
  { month: 'Jun', value: 43.2, year: 2024 },
  { month: 'Jul', value: 45.0, year: 2024 },
  { month: 'Aug', value: 46.5, year: 2024 },
  { month: 'Sep', value: 45.8, year: 2024 },
  { month: 'Oct', value: 47.5, year: 2024 },
];

export function DealsRow({ deals, isLoading }: DealsRowProps): JSX.Element {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // SVG chart dimensions
  const width = 600;
  const height = 200;
  const padding = { top: 30, right: 30, bottom: 35, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const minValue = Math.min(...monthlyData.map(d => d.value)) * 0.9;
  const maxValue = Math.max(...monthlyData.map(d => d.value)) * 1.05;
  const range = maxValue - minValue;
  
  const points = monthlyData.map((d, i) => ({
    x: padding.left + (i / (monthlyData.length - 1)) * chartWidth,
    y: padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight,
    ...d,
    index: i,
  }));
  
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;
  const prevValue = hoveredIndex !== null && hoveredIndex > 0 ? monthlyData[hoveredIndex - 1].value : null;
  const changePercent = hoveredPoint && prevValue 
    ? ((hoveredPoint.value - prevValue) / prevValue * 100).toFixed(1)
    : null;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">Monthly Portfolio Growth</h2>
        </div>
        <Link to="/manager/deals" className="p-1.5 hover:bg-muted rounded-lg transition-colors">
          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
        </Link>
      </div>

      {isLoading ? (
        <Skeleton className="h-[200px] w-full" />
      ) : (
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
                ${(minValue + range * pct).toFixed(0)}M
              </text>
            ))}
            
            {/* Area gradient */}
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            
            {/* Area fill */}
            <path d={areaPath} fill="url(#portfolioGradient)" />
            
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
            
            {/* Data points - always visible but smaller, larger on hover */}
            {points.map((p, i) => (
              <g key={i}>
                {/* Invisible larger hit area */}
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
                className={`text-[11px] transition-colors ${
                  hoveredIndex === i ? 'fill-foreground font-medium' : 'fill-muted-foreground'
                }`}
              >
                {p.month}
              </text>
            ))}
            
            {/* Hover tooltip */}
            {hoveredPoint && (
              <g 
                transform={`translate(${
                  hoveredPoint.x > width - 120 ? hoveredPoint.x - 115 : hoveredPoint.x + 15
                }, ${
                  hoveredPoint.y < 60 ? hoveredPoint.y + 10 : hoveredPoint.y - 55
                })`}
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
                  {hoveredPoint.month}, {hoveredPoint.year}
                </text>
                <text x="10" y="35" className="fill-foreground text-sm font-bold">
                  ${hoveredPoint.value}M
                </text>
                {changePercent && (
                  <text 
                    x="60" 
                    y="35" 
                    className={`text-[10px] font-semibold ${
                      parseFloat(changePercent) >= 0 ? 'fill-emerald-600' : 'fill-red-500'
                    }`}
                  >
                    {parseFloat(changePercent) >= 0 ? '↗' : '↘'} {Math.abs(parseFloat(changePercent))}%
                  </text>
                )}
              </g>
            )}
          </svg>
        </div>
      )}
    </div>
  );
}

