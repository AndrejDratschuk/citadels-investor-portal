/**
 * Fund Overview Row
 * Displays 8 primary fund KPIs in a responsive grid
 */

import {
  DollarSign,
  TrendingUp,
  Wallet,
  Landmark,
  PiggyBank,
  CreditCard,
  BarChart3,
  LineChart,
} from 'lucide-react';
import { formatCurrency } from '@flowveda/shared';
import type { FundKpis } from '@/lib/api/dashboard';
import { Skeleton } from '@/components/ui/skeleton';

interface FundOverviewRowProps {
  kpis: FundKpis | null;
  isLoading: boolean;
}

function formatValue(value: number | null, isCurrency: boolean = true): string {
  if (value === null) return 'N/A';
  if (isCurrency) return formatCurrency(value);
  return `${value.toFixed(1)}%`;
}

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  isLoading: boolean;
}

function KpiCard({ title, value, icon, isLoading }: KpiCardProps): JSX.Element {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
          {isLoading ? (
            <Skeleton className="mt-1 h-6 w-20" />
          ) : (
            <p className="text-lg font-bold tracking-tight truncate">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function FundOverviewRow({ kpis, isLoading }: FundOverviewRowProps): JSX.Element {
  const items = [
    {
      title: 'Total AUM',
      value: formatValue(kpis?.totalAum ?? null),
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      title: 'Committed Capital',
      value: formatValue(kpis?.committedCapital ?? null),
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      title: 'Capital Called',
      value: formatValue(kpis?.capitalCalled ?? null),
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      title: 'Capital Deployed',
      value: formatValue(kpis?.capitalDeployed ?? null),
      icon: <Landmark className="h-4 w-4" />,
    },
    {
      title: 'Cash on Hand',
      value: formatValue(kpis?.cashOnHand ?? null),
      icon: <PiggyBank className="h-4 w-4" />,
    },
    {
      title: 'Debt Outstanding',
      value: formatValue(kpis?.debtOutstanding ?? null),
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      title: 'Fund ROI',
      value: formatValue(kpis?.fundRoiPercent ?? null, false),
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      title: 'IRR',
      value: formatValue(kpis?.irrPercent ?? null, false),
      icon: <LineChart className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Fund Overview</h2>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
        {items.map((item) => (
          <KpiCard
            key={item.title}
            title={item.title}
            value={item.value}
            icon={item.icon}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
}

