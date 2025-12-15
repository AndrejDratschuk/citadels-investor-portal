import { Link } from 'react-router-dom';
import { MapPin, TrendingUp, Users, Building2, Factory, Store, Landmark, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@flowveda/shared';

export interface Deal {
  id: string;
  name: string;
  description: string | null;
  status: 'prospective' | 'under_contract' | 'acquired' | 'renovating' | 'stabilized' | 'for_sale' | 'sold';
  address: {
    city?: string;
    state?: string;
  } | null;
  propertyType: 'multifamily' | 'office' | 'retail' | 'industrial' | 'other' | null;
  unitCount: number | null;
  squareFootage: number | null;
  currentValue: number | null;
  imageUrl?: string | null;
  kpis: {
    occupancyRate?: number;
    capRate?: number;
    noi?: number;
  } | null;
  investorCount?: number;
}

interface DealCardProps {
  deal: Deal;
  className?: string;
}

const statusStyles: Record<string, string> = {
  prospective: 'bg-gray-100 text-gray-700',
  under_contract: 'bg-yellow-100 text-yellow-700',
  acquired: 'bg-blue-100 text-blue-700',
  renovating: 'bg-orange-100 text-orange-700',
  stabilized: 'bg-green-100 text-green-700',
  for_sale: 'bg-purple-100 text-purple-700',
  sold: 'bg-gray-100 text-gray-700',
};

// Property type gradients and icons for placeholder
const propertyTypeConfig: Record<string, { gradient: string; icon: React.ReactNode }> = {
  multifamily: {
    gradient: 'from-blue-600 to-indigo-700',
    icon: <Building2 className="h-10 w-10 text-white/80" />,
  },
  office: {
    gradient: 'from-slate-600 to-slate-800',
    icon: <Landmark className="h-10 w-10 text-white/80" />,
  },
  retail: {
    gradient: 'from-amber-500 to-orange-600',
    icon: <Store className="h-10 w-10 text-white/80" />,
  },
  industrial: {
    gradient: 'from-zinc-600 to-zinc-800',
    icon: <Factory className="h-10 w-10 text-white/80" />,
  },
  other: {
    gradient: 'from-purple-600 to-violet-700',
    icon: <Home className="h-10 w-10 text-white/80" />,
  },
};

export function DealCard({ deal, className }: DealCardProps) {
  const config = propertyTypeConfig[deal.propertyType || 'other'] || propertyTypeConfig.other;

  return (
    <Link
      to={`/manager/deals/${deal.id}`}
      className={cn(
        'block rounded-xl border bg-card overflow-hidden shadow-sm transition-all hover:shadow-lg hover:border-primary/50',
        className
      )}
    >
      {/* Header with deal image or styled placeholder */}
      <div className="h-32 relative">
        {deal.imageUrl ? (
          <img
            src={deal.imageUrl}
            alt={deal.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={cn(
              'flex h-full w-full items-center justify-center bg-gradient-to-br',
              config.gradient
            )}
          >
            {config.icon}
          </div>
        )}
        {/* Status badge overlay */}
        <div className="absolute top-3 right-3">
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-medium capitalize shadow-sm',
              statusStyles[deal.status]
            )}
          >
            {deal.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg">{deal.name}</h3>
        
        {deal.address && (
          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>
              {[deal.address.city, deal.address.state].filter(Boolean).join(', ')}
            </span>
          </div>
        )}

        {deal.description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {deal.description}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <p className="text-xs text-muted-foreground">Current Value</p>
            <p className="font-semibold">
              {deal.currentValue ? formatCurrency(deal.currentValue) : '—'}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <p className="text-xs text-muted-foreground">Occupancy</p>
            <p className="font-semibold">
              {deal.kpis?.occupancyRate
                ? `${(deal.kpis.occupancyRate * 100).toFixed(0)}%`
                : '—'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          {deal.kpis?.capRate && (
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span>{(deal.kpis.capRate * 100).toFixed(1)}% Cap Rate</span>
            </div>
          )}
          {deal.investorCount !== undefined && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{deal.investorCount} investors</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
