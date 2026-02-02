import { Link } from 'react-router-dom';
import { Building2, Loader2, TrendingUp } from 'lucide-react';
import { formatCurrency, formatDate, formatPercentage } from '@altsui/shared';
import type { Investment } from '@/lib/api/investors';

interface InvestmentsTabProps {
  investments: Investment[];
  isLoading: boolean;
}

function calculateTotalPortfolioValue(investments: Investment[]): number {
  return investments.reduce((sum, inv) => {
    if (inv.deal?.currentValue && inv.ownershipPercentage) {
      return sum + inv.deal.currentValue * inv.ownershipPercentage;
    }
    return sum;
  }, 0);
}

export function InvestmentsTab({
  investments,
  isLoading,
}: InvestmentsTabProps): JSX.Element {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Deal Investments</h3>
          <p className="text-sm text-muted-foreground">
            Deals this investor is assigned to
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : investments.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-3 font-medium">No investments yet</p>
            <p className="text-sm text-muted-foreground">
              Assign this investor to deals from the Deal Detail page
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {investments.map((investment, index) => {
              const deal = investment.deal;
              if (!deal) return null;

              const investmentValue = deal.currentValue
                ? deal.currentValue * investment.ownershipPercentage
                : 0;

              return (
                <div
                  key={deal.id || index}
                  className="flex items-center justify-between p-4 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <Link
                        to={`/manager/deals/${deal.id}`}
                        className="font-medium hover:underline"
                      >
                        {deal.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {formatPercentage(investment.ownershipPercentage)}{' '}
                        ownership
                        {deal.status && (
                          <span className="ml-2 capitalize">
                            • {deal.status.replace(/_/g, ' ')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(investmentValue)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {investment.joinedAt &&
                        `Joined ${formatDate(investment.joinedAt)}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {investments.length > 0 && (
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-medium">Total Portfolio Value</span>
            </div>
            <span className="text-xl font-bold">
              {formatCurrency(calculateTotalPortfolioValue(investments))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
