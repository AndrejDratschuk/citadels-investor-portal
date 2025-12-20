/**
 * Fund Overview Row
 * Displays primary fund KPIs in a clean, compact grid with trend chart
 */

import {
  DollarSign,
  TrendingUp,
  Wallet,
  Landmark,
  PiggyBank,
  CreditCard,
  BarChart3,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { formatCurrency } from '@flowveda/shared';
import type { FundKpis } from '@/lib/api/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { FundChart } from './FundChart';

interface FundOverviewRowProps {
  kpis: FundKpis | null;
  isLoading: boolean;
}

function formatCompact(value: number | null): string {
  if (value === null) return '—';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  isLoading: boolean;
  trend?: number;
  accent?: 'green' | 'blue' | 'amber' | 'default';
}

function KpiCard({ title, value, icon, isLoading, trend, accent = 'default' }: KpiCardProps): JSX.Element {
  const accentStyles = {
    green: 'border-l-emerald-500 bg-emerald-500/5',
    blue: 'border-l-blue-500 bg-blue-500/5',
    amber: 'border-l-amber-500 bg-amber-500/5',
    default: 'border-l-transparent',
  };

  return (
    <div className={`rounded-lg border border-l-4 bg-card px-4 py-3 ${accentStyles[accent]}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
          {isLoading ? (
            <Skeleton className="mt-1.5 h-6 w-16" />
          ) : (
            <p className="mt-0.5 text-xl font-semibold tracking-tight">{value}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
            {icon}
          </div>
          {trend !== undefined && !isLoading && (
            <span className={`flex items-center text-[10px] font-medium ${
              trend >= 0 ? 'text-emerald-600' : 'text-red-500'
            }`}>
              {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Performance trend data (6 months)
const performanceTrend = [
  { label: 'Jul', value: 42.1 },
  { label: 'Aug', value: 43.8 },
  { label: 'Sep', value: 44.2 },
  { label: 'Oct', value: 45.5 },
  { label: 'Nov', value: 46.2 },
  { label: 'Dec', value: 47.5 },
];

export function FundOverviewRow({ kpis, isLoading }: FundOverviewRowProps): JSX.Element {
  const items = [
    {
      title: 'Total AUM',
      value: formatCompact(kpis?.totalAum ?? null),
      icon: <DollarSign className="h-3.5 w-3.5" />,
      trend: 2.8,
      accent: 'green' as const,
    },
    {
      title: 'Committed',
      value: formatCompact(kpis?.committedCapital ?? null),
      icon: <Wallet className="h-3.5 w-3.5" />,
    },
    {
      title: 'Called',
      value: formatCompact(kpis?.capitalCalled ?? null),
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      trend: 1.2,
    },
    {
      title: 'Deployed',
      value: formatCompact(kpis?.capitalDeployed ?? null),
      icon: <Landmark className="h-3.5 w-3.5" />,
    },
    {
      title: 'Cash',
      value: formatCompact(kpis?.cashOnHand ?? null),
      icon: <PiggyBank className="h-3.5 w-3.5" />,
      accent: 'blue' as const,
    },
    {
      title: 'Debt',
      value: formatCompact(kpis?.debtOutstanding ?? null),
      icon: <CreditCard className="h-3.5 w-3.5" />,
      trend: -0.5,
      accent: 'amber' as const,
    },
    {
      title: 'ROI',
      value: kpis?.fundRoiPercent !== null ? `${kpis.fundRoiPercent.toFixed(1)}%` : '—',
      icon: <BarChart3 className="h-3.5 w-3.5" />,
      trend: 3.2,
      accent: 'green' as const,
    },
    {
      title: 'IRR',
      value: kpis?.irrPercent !== null ? `${kpis.irrPercent.toFixed(1)}%` : '—',
      icon: <Percent className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {/* KPI Grid - 2 cols on xl */}
      <div className="xl:col-span-2">
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {items.map((item) => (
            <KpiCard
              key={item.title}
              title={item.title}
              value={item.value}
              icon={item.icon}
              isLoading={isLoading}
              trend={item.trend}
              accent={item.accent}
            />
          ))}
        </div>
      </div>
      
      {/* Trend Chart - 1 col */}
      <div>
        {isLoading ? (
          <Skeleton className="h-full min-h-[180px] rounded-xl" />
        ) : (
          <FundChart 
            title="AUM Trend" 
            data={performanceTrend} 
            type="area"
            height={180}
          />
        )}
      </div>
    </div>
  );
}

