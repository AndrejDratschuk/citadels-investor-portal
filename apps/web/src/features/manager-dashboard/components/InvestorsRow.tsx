/**
 * Investors Row
 * Compact investor status + top investors list
 */

import { Link } from 'react-router-dom';
import { ArrowRight, Users, UserCheck, UserPlus, Clock } from 'lucide-react';
import type { InvestorsMetrics, TopInvestor, InvestorStatusCounts } from '@/lib/api/dashboard';
import { Skeleton } from '@/components/ui/skeleton';

interface InvestorsRowProps {
  investors: InvestorsMetrics | null;
  isLoading: boolean;
}

function formatCompact(value: number | null): string {
  if (value === null) return '—';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function StatusBar({ counts, isLoading }: { counts: InvestorStatusCounts | null; isLoading: boolean }): JSX.Element {
  if (isLoading || !counts) {
    return <Skeleton className="h-20 w-full" />;
  }

  const total = counts.active + counts.onboarding + counts.prospect + counts.inactive;
  const items = [
    { label: 'Active', value: counts.active, icon: UserCheck, color: 'bg-emerald-500', text: 'text-emerald-600' },
    { label: 'Onboarding', value: counts.onboarding, icon: Clock, color: 'bg-blue-500', text: 'text-blue-600' },
    { label: 'Prospects', value: counts.prospect, icon: UserPlus, color: 'bg-amber-500', text: 'text-amber-600' },
  ];

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        {items.map((item) => (
          item.value > 0 && (
            <div
              key={item.label}
              className={`${item.color} transition-all`}
              style={{ width: `${(item.value / total) * 100}%` }}
            />
          )
        ))}
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <div className={`text-lg font-semibold ${item.text}`}>{item.value}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopInvestorsList({ investors, isLoading }: { investors: TopInvestor[]; isLoading: boolean }): JSX.Element {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  if (investors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
        <Users className="mb-2 h-6 w-6" />
        <p className="text-xs">No investors yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {investors.map((investor) => {
        const callPercent = investor.capitalCommitted > 0 
          ? (investor.capitalCalled / investor.capitalCommitted) * 100 
          : 0;
        
        return (
          <Link
            key={investor.id}
            to={`/manager/investors/${investor.id}`}
            className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                {investor.name.charAt(0)}
              </span>
              <span className="text-sm font-medium truncate group-hover:text-primary">{investor.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground">{formatCompact(investor.capitalCommitted)}</span>
              <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${callPercent}%` }}
                />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function InvestorsRow({ investors, isLoading }: InvestorsRowProps): JSX.Element {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">
          Investors
          {investors && !isLoading && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              ({investors.totalCount})
            </span>
          )}
        </h2>
        <Link
          to="/manager/investors"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-4">
        {/* Status Overview */}
        <StatusBar counts={investors?.statusCounts ?? null} isLoading={isLoading} />

        {/* Top Investors */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Top Investors</p>
          <TopInvestorsList investors={investors?.top5 ?? []} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}

