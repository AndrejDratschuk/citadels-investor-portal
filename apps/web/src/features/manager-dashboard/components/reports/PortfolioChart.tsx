import { cn } from '@/lib/utils';
import { formatCurrency } from '@altsui/shared';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
  [key: string]: string | number | undefined;
}

interface PortfolioChartProps {
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  type: 'bar' | 'donut';
  className?: string;
}

const COLORS = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
];

export function PortfolioChart({
  title,
  subtitle,
  data,
  type,
  className,
}: PortfolioChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="rounded-lg border bg-popover px-3 py-2 shadow-lg">
          <p className="font-medium">{item.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(item.value)}
          </p>
          <p className="text-xs text-muted-foreground">
            {((item.value / total) * 100).toFixed(1)}% of portfolio
          </p>
        </div>
      );
    }
    return null;
  };

  if (type === 'donut') {
    return (
      <div className={cn('rounded-2xl border bg-card p-6', className)}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="relative h-48 w-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{data.length}</span>
              <span className="text-xs text-muted-foreground">deals</span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {data.slice(0, 6).map((item, index) => (
              <div key={item.name} className="flex items-center gap-3">
                <div
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm">{item.name}</span>
                    <span className="ml-2 text-sm font-medium">
                      {((item.value / total) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {data.length > 6 && (
              <p className="text-xs text-muted-foreground">
                +{data.length - 6} more deals
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Bar chart
  return (
    <div className={cn('rounded-2xl border bg-card p-6', className)}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={entry.color || COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

