/**
 * Investors Row
 * Investor status visualization + Top 5 investors + View All link
 */

import { Link } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
import { formatCurrency } from '@flowveda/shared';
import type { InvestorsMetrics, TopInvestor, InvestorStatusCounts } from '@/lib/api/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { FundChart } from './FundChart';

interface InvestorsRowProps {
  investors: InvestorsMetrics | null;
  isLoading: boolean;
}

function StatusDonut({
  counts,
  isLoading,
}: {
  counts: InvestorStatusCounts | null;
  isLoading: boolean;
}): JSX.Element {
  if (isLoading || !counts) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Skeleton className="h-32 w-32 rounded-full" />
      </div>
    );
  }

  const data = [
    { label: 'Active', value: counts.active, color: 'bg-green-500' },
    { label: 'Onboarding', value: counts.onboarding, color: 'bg-blue-500' },
    { label: 'Prospect', value: counts.prospect, color: 'bg-gray-400' },
    { label: 'Inactive', value: counts.inactive, color: 'bg-red-400' },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Users className="mb-2 h-8 w-8" />
        <p className="text-sm">No investors yet</p>
      </div>
    );
  }

  return <FundChart title="Investor Status" data={data} type="donut" />;
}

function TopInvestorsTable({
  investors,
  isLoading,
}: {
  investors: TopInvestor[];
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

  if (investors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Users className="mb-2 h-8 w-8" />
        <p className="text-sm">No investors yet</p>
        <Link
          to="/manager/investors/new"
          className="mt-2 text-sm text-primary hover:underline"
        >
          Add your first investor
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Investor</th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">Committed</th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">Called</th>
          </tr>
        </thead>
        <tbody>
          {investors.map((investor, idx) => (
            <tr key={investor.id} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
              <td className="px-3 py-2">
                <Link
                  to={`/manager/investors/${investor.id}`}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {investor.name}
                </Link>
              </td>
              <td className="px-3 py-2 text-right">
                {formatCurrency(investor.capitalCommitted)}
              </td>
              <td className="px-3 py-2 text-right">{formatCurrency(investor.capitalCalled)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function InvestorsRow({ investors, isLoading }: InvestorsRowProps): JSX.Element {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
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

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Left: Status Donut (2 cols) */}
        <div className="lg:col-span-2">
          <StatusDonut counts={investors?.statusCounts ?? null} isLoading={isLoading} />
        </div>

        {/* Right: Top 5 Investors Table (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Top 5 Investors</h3>
          <TopInvestorsTable investors={investors?.top5 ?? []} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}

