import { TrendingUp } from 'lucide-react';
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

  return (
    <div className={className}>
      <div className="rounded-xl border bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Portfolio Summary
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">
                {formatCurrency(totalAum)}
              </span>
              <span className="text-sm text-slate-400">Total AUM</span>
            </div>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
            <TrendingUp className="h-7 w-7 text-emerald-400" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-6 border-t border-slate-700 pt-4">
          <div>
            <p className="text-2xl font-semibold">{deals.length}</p>
            <p className="text-xs text-slate-400">Active Deals</p>
          </div>
          <div className="h-8 w-px bg-slate-700" />
          <div>
            <p className="text-2xl font-semibold">
              {deals.filter(d => d.currentValue).length}
            </p>
            <p className="text-xs text-slate-400">With Valuations</p>
          </div>
        </div>
      </div>
    </div>
  );
}

