/**
 * Investors Row
 * Donut chart for status + Top 5 investors table
 */

import { Link } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
import type { InvestorsMetrics, TopInvestor, InvestorStatusCounts } from '@/lib/api/dashboard';
import { Skeleton } from '@/components/ui/skeleton';

interface InvestorsRowProps {
  investors: InvestorsMetrics | null;
  isLoading: boolean;
}

function formatCompact(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

const statusColors = [
  { bg: 'bg-emerald-500', stroke: '#10b981' },
  { bg: 'bg-blue-500', stroke: '#3b82f6' },
  { bg: 'bg-amber-500', stroke: '#f59e0b' },
  { bg: 'bg-gray-400', stroke: '#9ca3af' },
];

function StatusDonut({ counts, isLoading }: { counts: InvestorStatusCounts | null; isLoading: boolean }): JSX.Element {
  if (isLoading || !counts) {
    return (
      <div className="flex items-center justify-center h-[160px]">
        <Skeleton className="h-28 w-28 rounded-full" />
      </div>
    );
  }

  const data = [
    { label: 'Active', value: counts.active, ...statusColors[0] },
    { label: 'Onboarding', value: counts.onboarding, ...statusColors[1] },
    { label: 'Prospect', value: counts.prospect, ...statusColors[2] },
    { label: 'Inactive', value: counts.inactive, ...statusColors[3] },
  ].filter(d => d.value > 0);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulativePercent = 0;

  return (
    <div className="flex items-center gap-6">
      {/* Donut */}
      <div className="relative h-28 w-28 shrink-0">
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
                r="14"
                fill="none"
                stroke={item.stroke}
                strokeWidth="4"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{total}</span>
          <span className="text-[10px] text-muted-foreground">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2 flex-1">
        {data.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${item.bg}`} />
              <span className="text-sm">{item.label}</span>
            </div>
            <span className="text-sm font-semibold">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopInvestorsTable({ investors, isLoading }: { investors: TopInvestor[]; isLoading: boolean }): JSX.Element {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (investors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
        <Users className="mb-2 h-8 w-8" />
        <p className="text-sm">No investors yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Investor</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Committed</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Called</th>
          </tr>
        </thead>
        <tbody>
          {investors.map((investor, idx) => (
            <tr key={investor.id} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
              <td className="px-3 py-2.5">
                <Link
                  to={`/manager/investors/${investor.id}`}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {investor.name}
                </Link>
              </td>
              <td className="px-3 py-2.5 text-right">{formatCompact(investor.capitalCommitted)}</td>
              <td className="px-3 py-2.5 text-right text-emerald-600">{formatCompact(investor.capitalCalled)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function InvestorsRow({ investors, isLoading }: InvestorsRowProps): JSX.Element {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">
          Investors
          {investors && !isLoading && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({investors.totalCount})
            </span>
          )}
        </h2>
        <Link
          to="/manager/investors"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Donut Chart */}
        <StatusDonut counts={investors?.statusCounts ?? null} isLoading={isLoading} />

        {/* Right: Top Investors */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Top 5 Investors</p>
          <TopInvestorsTable investors={investors?.top5 ?? []} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}

