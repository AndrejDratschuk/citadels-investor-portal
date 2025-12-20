/**
 * Deals Row
 * Compact view of top deals with portfolio chart
 */

import { Link } from 'react-router-dom';
import { ArrowRight, Building2, TrendingUp, TrendingDown } from 'lucide-react';
import type { DealsMetrics, TopDeal, PortfolioAllocation } from '@/lib/api/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { FundChart } from './FundChart';

interface DealsRowProps {
  deals: DealsMetrics | null;
  isLoading: boolean;
}

function formatCompact(value: number | null): string {
  if (value === null) return '—';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function TopDealsTable({ deals, isLoading }: { deals: TopDeal[]; isLoading: boolean }): JSX.Element {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
        <Building2 className="mb-2 h-6 w-6" />
        <p className="text-xs">No deals yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {deals.map((deal, idx) => (
        <Link
          key={deal.id}
          to={`/manager/deals/${deal.id}`}
          className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-medium text-muted-foreground">
              {idx + 1}
            </span>
            <span className="text-sm font-medium truncate group-hover:text-primary">{deal.name}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-muted-foreground">{formatCompact(deal.capitalInvested)}</span>
            {deal.roiPercent !== null && (
              <span className={`flex items-center gap-0.5 text-xs font-medium ${
                deal.roiPercent >= 0 ? 'text-emerald-600' : 'text-red-500'
              }`}>
                {deal.roiPercent >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(deal.roiPercent).toFixed(1)}%
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

export function DealsRow({ deals, isLoading }: DealsRowProps): JSX.Element {
  const chartData: Array<{ label: string; value: number }> = (deals?.portfolioByDeal ?? [])
    .slice(0, 5)
    .map((p: PortfolioAllocation) => ({
      label: p.dealName.length > 12 ? p.dealName.substring(0, 12) + '…' : p.dealName,
      value: p.value,
    }));

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Deals</h2>
        <Link
          to="/manager/deals"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-4">
        {/* Top Deals List */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Top Performers</p>
          <TopDealsTable deals={deals?.top5 ?? []} isLoading={isLoading} />
        </div>

        {/* Portfolio Chart */}
        {chartData.length > 0 && !isLoading && (
          <FundChart 
            title="Portfolio Allocation" 
            data={chartData} 
            type="bar"
            showValues={true}
          />
        )}
      </div>
    </div>
  );
}

