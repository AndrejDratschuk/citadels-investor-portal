import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { formatCurrency, formatPercentage, formatDate } from '@altsui/shared';
import { useInvestments } from '../hooks/useInvestments';
import { Button } from '@/components/ui/button';

const statusColors: Record<string, string> = {
  prospective: 'bg-gray-100 text-gray-700',
  under_contract: 'bg-yellow-100 text-yellow-700',
  acquired: 'bg-blue-100 text-blue-700',
  renovating: 'bg-orange-100 text-orange-700',
  stabilized: 'bg-green-100 text-green-700',
  for_sale: 'bg-purple-100 text-purple-700',
  sold: 'bg-gray-100 text-gray-700',
};

export function InvestorInvestmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: investments, isLoading } = useInvestments();

  const investment = investments?.find((inv) => inv.deal?.id === id);
  const deal = investment?.deal;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading investment...</p>
        </div>
      </div>
    );
  }

  if (!investment || !deal) {
    return (
      <div className="space-y-6">
        <Link to="/investor/investments">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Investments
          </Button>
        </Link>
        <div className="rounded-lg border bg-card p-12 text-center">
          <Building2 className="mx-auto h-16 w-16 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Investment not found</h3>
          <p className="mt-2 text-muted-foreground">
            This investment may have been removed or you don't have access.
          </p>
        </div>
      </div>
    );
  }

  const investorShare = deal.currentValue
    ? deal.currentValue * investment.ownershipPercentage
    : null;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/investor/investments">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Investments
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{deal.name}</h1>
            {deal.address && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {[deal.address.street, deal.address.city, deal.address.state]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${
            statusColors[deal.status] || 'bg-gray-100 text-gray-700'
          }`}
        >
          {deal.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Your Investment */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Your Investment</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Ownership Stake</p>
            <p className="mt-1 text-2xl font-bold">
              {formatPercentage(investment.ownershipPercentage)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Your Share Value</p>
            <p className="mt-1 text-2xl font-bold">
              {investorShare ? formatCurrency(investorShare) : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Invested Since</p>
            <p className="mt-1 text-2xl font-bold">
              {formatDate(investment.joinedAt, { year: 'numeric', month: 'short' })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Property Type</p>
            <p className="mt-1 text-2xl font-bold capitalize">
              {deal.propertyType || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Property Details</h2>
          <div className="space-y-4">
            {deal.description && (
              <p className="text-muted-foreground">{deal.description}</p>
            )}
            <div className="grid grid-cols-2 gap-4">
              {deal.unitCount && (
                <div>
                  <p className="text-sm text-muted-foreground">Units</p>
                  <p className="font-semibold">{deal.unitCount}</p>
                </div>
              )}
              {deal.squareFootage && (
                <div>
                  <p className="text-sm text-muted-foreground">Square Footage</p>
                  <p className="font-semibold">
                    {deal.squareFootage.toLocaleString()} sq ft
                  </p>
                </div>
              )}
              {deal.acquisitionDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Acquired</p>
                  <p className="font-semibold">{formatDate(deal.acquisitionDate)}</p>
                </div>
              )}
              {deal.acquisitionPrice && (
                <div>
                  <p className="text-sm text-muted-foreground">Acquisition Price</p>
                  <p className="font-semibold">
                    {formatCurrency(deal.acquisitionPrice)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Key Metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            {deal.currentValue && (
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <p className="text-sm text-muted-foreground">Current Value</p>
                </div>
                <p className="mt-1 text-xl font-bold">
                  {formatCurrency(deal.currentValue)}
                </p>
              </div>
            )}
            {deal.kpis?.noi && (
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-muted-foreground">NOI</p>
                </div>
                <p className="mt-1 text-xl font-bold">
                  {formatCurrency(deal.kpis.noi)}
                </p>
              </div>
            )}
            {deal.kpis?.capRate && (
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Cap Rate</p>
                <p className="mt-1 text-xl font-bold">
                  {(deal.kpis.capRate * 100).toFixed(2)}%
                </p>
              </div>
            )}
            {deal.kpis?.occupancyRate && (
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Occupancy</p>
                <p className="mt-1 text-xl font-bold">
                  {(deal.kpis.occupancyRate * 100).toFixed(1)}%
                </p>
              </div>
            )}
            {deal.kpis?.cashOnCash && (
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Cash-on-Cash</p>
                <p className="mt-1 text-xl font-bold">
                  {(deal.kpis.cashOnCash * 100).toFixed(2)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


