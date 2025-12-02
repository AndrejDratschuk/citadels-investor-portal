import { Building2 } from 'lucide-react';
import { useInvestments } from '../hooks/useInvestments';
import { InvestmentCard } from '../components/InvestmentCard';

export function InvestorInvestments() {
  const { data: investments, isLoading, error } = useInvestments();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading investments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-800">Failed to load investments</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Investments</h1>
        <p className="mt-1 text-muted-foreground">
          View all properties in your portfolio
        </p>
      </div>

      {investments && investments.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {investments.map((investment, index) => (
            <InvestmentCard key={investment.deal?.id || index} investment={investment} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-12 text-center">
          <Building2 className="mx-auto h-16 w-16 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No investments yet</h3>
          <p className="mt-2 text-muted-foreground">
            Your investments will appear here once you're allocated to deals.
          </p>
        </div>
      )}
    </div>
  );
}


