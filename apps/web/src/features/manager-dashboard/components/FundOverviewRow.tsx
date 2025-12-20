/**
 * Fund Overview Row
 * Displays 8 primary KPI cards in two rows
 */

import {
  DollarSign,
  TrendingUp,
  Wallet,
  BarChart3,
  Landmark,
  PiggyBank,
  CreditCard,
  Percent,
} from 'lucide-react';
import type { FundKpis } from '@/lib/api/dashboard';
import { Skeleton } from '@/components/ui/skeleton';

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
  iconBg: string;
  isLoading: boolean;
  change?: number;
  changeLabel?: string;
}

function KpiCard({ title, value, icon, iconBg, isLoading, change, changeLabel = 'vs Last Month' }: KpiCardProps): JSX.Element {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
      </div>
      
      {isLoading ? (
        <Skeleton className="h-8 w-20 mb-1.5" />
      ) : (
        <p className="text-2xl font-bold tracking-tight mb-1">{value}</p>
      )}
      
      {change !== undefined && !isLoading && (
        <div className="flex items-center gap-1 text-xs">
          <span className={`font-semibold ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(0)}%
          </span>
          <span className="text-muted-foreground">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}

export function FundOverviewRow({ kpis, isLoading }: FundOverviewRowProps): JSX.Element {
  const items = [
    {
      title: 'Total AUM',
      value: formatCompact(kpis?.totalAum ?? null),
      icon: <DollarSign className="h-4 w-4 text-emerald-600" />,
      iconBg: 'bg-emerald-100',
      change: 20,
    },
    {
      title: 'Committed Capital',
      value: formatCompact(kpis?.committedCapital ?? null),
      icon: <Wallet className="h-4 w-4 text-blue-600" />,
      iconBg: 'bg-blue-100',
      change: 15,
    },
    {
      title: 'Capital Called',
      value: formatCompact(kpis?.capitalCalled ?? null),
      icon: <TrendingUp className="h-4 w-4 text-cyan-600" />,
      iconBg: 'bg-cyan-100',
      change: 12,
    },
    {
      title: 'Capital Deployed',
      value: formatCompact(kpis?.capitalDeployed ?? null),
      icon: <Landmark className="h-4 w-4 text-purple-600" />,
      iconBg: 'bg-purple-100',
      change: 10,
    },
    {
      title: 'Cash on Hand',
      value: formatCompact(kpis?.cashOnHand ?? null),
      icon: <PiggyBank className="h-4 w-4 text-green-600" />,
      iconBg: 'bg-green-100',
      change: 5,
    },
    {
      title: 'Debt Outstanding',
      value: formatCompact(kpis?.debtOutstanding ?? null),
      icon: <CreditCard className="h-4 w-4 text-orange-600" />,
      iconBg: 'bg-orange-100',
      change: -3,
    },
    {
      title: 'Fund ROI',
      value: kpis && kpis.fundRoiPercent != null ? `${kpis.fundRoiPercent.toFixed(1)}%` : '—',
      icon: <BarChart3 className="h-4 w-4 text-indigo-600" />,
      iconBg: 'bg-indigo-100',
      change: 8,
    },
    {
      title: 'IRR',
      value: kpis && kpis.irrPercent != null ? `${kpis.irrPercent.toFixed(1)}%` : '—',
      icon: <Percent className="h-4 w-4 text-pink-600" />,
      iconBg: 'bg-pink-100',
      change: 6,
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
      {items.map((item) => (
        <KpiCard
          key={item.title}
          title={item.title}
          value={item.value}
          icon={item.icon}
          iconBg={item.iconBg}
          isLoading={isLoading}
          change={item.change}
        />
      ))}
    </div>
  );
}

