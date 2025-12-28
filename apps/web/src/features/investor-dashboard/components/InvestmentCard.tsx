import { Link } from 'react-router-dom';
import { Building2, MapPin, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Investment } from '@/lib/api/investors';
import { formatCurrency, formatPercentage } from '@altsui/shared';

interface InvestmentCardProps {
  investment: Investment;
  className?: string;
}

const statusColors: Record<string, string> = {
  prospective: 'bg-gray-100 text-gray-700',
  under_contract: 'bg-yellow-100 text-yellow-700',
  acquired: 'bg-blue-100 text-blue-700',
  renovating: 'bg-orange-100 text-orange-700',
  stabilized: 'bg-green-100 text-green-700',
  for_sale: 'bg-purple-100 text-purple-700',
  sold: 'bg-gray-100 text-gray-700',
};

const propertyTypeLabels: Record<string, string> = {
  multifamily: 'Multifamily',
  office: 'Office',
  retail: 'Retail',
  industrial: 'Industrial',
  other: 'Other',
};

export function InvestmentCard({ investment, className }: InvestmentCardProps) {
  const { deal, ownershipPercentage } = investment;

  if (!deal) return null;

  const investorShare = deal.currentValue
    ? deal.currentValue * ownershipPercentage
    : null;

  return (
    <Link
      to={`/investor/investments/${deal.id}`}
      className={cn(
        'block rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{deal.name}</h3>
            {deal.propertyType && (
              <p className="text-sm text-muted-foreground">
                {propertyTypeLabels[deal.propertyType] || deal.propertyType}
              </p>
            )}
          </div>
        </div>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
            statusColors[deal.status] || 'bg-gray-100 text-gray-700'
          )}
        >
          {deal.status.replace(/_/g, ' ')}
        </span>
      </div>

      {deal.address && (
        <div className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>
            {[deal.address.city, deal.address.state].filter(Boolean).join(', ')}
          </span>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4">
        <div>
          <p className="text-xs text-muted-foreground">Your Ownership</p>
          <p className="mt-0.5 text-lg font-semibold">
            {formatPercentage(ownershipPercentage)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Your Share Value</p>
          <p className="mt-0.5 text-lg font-semibold">
            {investorShare ? formatCurrency(investorShare) : '—'}
          </p>
        </div>
      </div>

      {deal.kpis && (
        <div className="mt-4 flex items-center gap-4 text-sm">
          {deal.kpis.capRate && (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>
                {(deal.kpis.capRate * 100).toFixed(1)}% Cap Rate
              </span>
            </div>
          )}
          {deal.kpis.occupancyRate && (
            <div>
              <span className="text-muted-foreground">Occupancy: </span>
              {(deal.kpis.occupancyRate * 100).toFixed(0)}%
            </div>
          )}
        </div>
      )}
    </Link>
  );
}


