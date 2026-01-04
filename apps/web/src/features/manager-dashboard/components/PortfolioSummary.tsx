import { TrendingUp, Building2, BarChart3 } from 'lucide-react';
import { formatCurrency } from '@altsui/shared';

interface DealForSummary {
  currentValue: number | null;
}

interface PortfolioSummaryProps {
  deals: DealForSummary[];
  className?: string;
}

export function PortfolioSummary({ deals, className }: PortfolioSummaryProps) {
  // Calculate total AUM (sum of currentValue for all deals)
  const totalAum = deals.reduce((sum, deal) => {
    return sum + (deal.currentValue || 0);
  }, 0);

  const dealsWithValuations = deals.filter(d => d.currentValue).length;

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total AUM Card */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total AUM</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {formatCurrency(totalAum)}
          </p>
        </div>

        {/* Active Deals Card */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Active Deals</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {deals.length}
          </p>
        </div>

        {/* With Valuations Card */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">With Valuations</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50">
              <BarChart3 className="h-5 w-5 text-violet-600" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {dealsWithValuations}
          </p>
        </div>
      </div>
    </div>
  );
}

