/**
 * Deals Row
 * Top 5 deals + rollup cards + portfolio chart + View All link
 */

import { Link } from 'react-router-dom';
import { ArrowRight, Building2 } from 'lucide-react';
import { formatCurrency } from '@flowveda/shared';
import type { DealsMetrics, TopDeal, PortfolioAllocation } from '@/lib/api/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { FundChart } from './FundChart';

interface DealsRowProps {
  deals: DealsMetrics | null;
  isLoading: boolean;
}

function formatRoi(value: number | null): string {
  if (value === null) return 'N/A';
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)}%`;
}

function RollupCard({
  label,
  value,
  isLoading,
}: {
  label: string;
  value: string;
  isLoading: boolean;
}): JSX.Element {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {isLoading ? (
        <Skeleton className="mt-1 h-5 w-16" />
      ) : (
        <p className="text-sm font-bold">{value}</p>
      )}
    </div>
  );
}

function TopDealsTable({
  deals,
  isLoading,
}: {
  deals: TopDeal[];
  isLoading: boolean;
}): JSX.Element {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Building2 className="mb-2 h-8 w-8" />
        <p className="text-sm">No deals yet</p>
        <Link
          to="/manager/deals/new"
          className="mt-2 text-sm text-primary hover:underline"
        >
          Create your first deal
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Deal</th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">Invested</th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">ROI</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal, idx) => (
            <tr key={deal.id} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
              <td className="px-3 py-2">
                <Link
                  to={`/manager/deals/${deal.id}`}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {deal.name}
                </Link>
              </td>
              <td className="px-3 py-2 text-right">
                {deal.capitalInvested !== null ? formatCurrency(deal.capitalInvested) : 'N/A'}
              </td>
              <td className="px-3 py-2 text-right">
                <span
                  className={
                    deal.roiPercent !== null
                      ? deal.roiPercent >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                      : ''
                  }
                >
                  {formatRoi(deal.roiPercent)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DealsRow({ deals, isLoading }: DealsRowProps): JSX.Element {
  const rollups = deals?.rollups ?? {
    capitalInvested: 0,
    capitalCollected: 0,
    capitalOutstanding: 0,
    capitalReserves: 0,
  };

  const chartData: Array<{ label: string; value: number }> = (deals?.portfolioByDeal ?? []).map(
    (p: PortfolioAllocation) => ({
      label: p.dealName,
      value: p.value,
    })
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Deals</h2>
        <Link
          to="/manager/deals"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Left: Top 5 Deals Table (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Top 5 Deals</h3>
          <TopDealsTable deals={deals?.top5 ?? []} isLoading={isLoading} />
        </div>

        {/* Right: Rollups + Chart (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Capital Summary</h3>
          <div className="grid grid-cols-2 gap-2">
            <RollupCard
              label="Invested"
              value={formatCurrency(rollups.capitalInvested)}
              isLoading={isLoading}
            />
            <RollupCard
              label="Collected"
              value={formatCurrency(rollups.capitalCollected)}
              isLoading={isLoading}
            />
            <RollupCard
              label="Outstanding"
              value={formatCurrency(rollups.capitalOutstanding)}
              isLoading={isLoading}
            />
            <RollupCard
              label="Reserves"
              value={formatCurrency(rollups.capitalReserves)}
              isLoading={isLoading}
            />
          </div>

          {chartData.length > 0 && (
            <div className="mt-4">
              <FundChart title="Portfolio by Deal" data={chartData} type="bar" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

