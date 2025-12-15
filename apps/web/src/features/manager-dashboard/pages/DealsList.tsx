import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, LayoutGrid, List, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DealCard, Deal } from '../components/DealCard';
import { PortfolioSummary } from '../components/PortfolioSummary';
import { dealsApi } from '@/lib/api/deals';
import { cn } from '@/lib/utils';

// Mock data - used as fallback when API is not available
const mockDeals: Deal[] = [
  {
    id: 'mock-1',
    name: 'Riverside Apartments',
    description: 'A 120-unit Class B multifamily property in a rapidly growing submarket with strong rent growth potential.',
    status: 'stabilized',
    address: { city: 'Austin', state: 'TX' },
    propertyType: 'multifamily',
    unitCount: 120,
    squareFootage: 95000,
    currentValue: 14200000,
    imageUrl: null,
    kpis: { occupancyRate: 0.94, capRate: 0.0693, noi: 985000 },
    investorCount: 15,
  },
  {
    id: 'mock-2',
    name: 'Downtown Office Tower',
    description: 'Class A office building in prime downtown location with long-term corporate tenants.',
    status: 'acquired',
    address: { city: 'Austin', state: 'TX' },
    propertyType: 'office',
    unitCount: null,
    squareFootage: 185000,
    currentValue: 28500000,
    imageUrl: null,
    kpis: { occupancyRate: 0.88, capRate: 0.0718, noi: 2100000 },
    investorCount: 22,
  },
  {
    id: 'mock-3',
    name: 'Eastside Industrial Park',
    description: 'Modern industrial/logistics facility with excellent highway access and strong tenant demand.',
    status: 'renovating',
    address: { city: 'Pflugerville', state: 'TX' },
    propertyType: 'industrial',
    unitCount: null,
    squareFootage: 250000,
    currentValue: 18500000,
    imageUrl: null,
    kpis: { occupancyRate: 0.72, capRate: 0.0622, noi: 1250000 },
    investorCount: 18,
  },
  {
    id: 'mock-4',
    name: 'Lakefront Retail Center',
    description: 'Neighborhood retail center anchored by grocery store with stable cash flow.',
    status: 'stabilized',
    address: { city: 'Cedar Park', state: 'TX' },
    propertyType: 'retail',
    unitCount: null,
    squareFootage: 65000,
    currentValue: 10500000,
    imageUrl: null,
    kpis: { occupancyRate: 0.97, capRate: 0.0743, noi: 780000 },
    investorCount: 12,
  },
  {
    id: 'mock-5',
    name: 'Tech Campus Development',
    description: 'Ground-up development of modern tech campus with pre-leased anchor tenant.',
    status: 'under_contract',
    address: { city: 'Round Rock', state: 'TX' },
    propertyType: 'office',
    unitCount: null,
    squareFootage: 320000,
    currentValue: null,
    imageUrl: null,
    kpis: null,
    investorCount: 0,
  },
];

type StatusFilter = 'all' | 'prospective' | 'under_contract' | 'acquired' | 'renovating' | 'stabilized' | 'for_sale' | 'sold';
type PropertyTypeFilter = 'all' | 'multifamily' | 'office' | 'retail' | 'industrial' | 'other';

export function DealsList() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<PropertyTypeFilter>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  // Fetch deals from API
  useEffect(() => {
    async function fetchDeals() {
      try {
        const apiDeals = await dealsApi.getAll();
        // Map API deals to match Deal interface for DealCard
        const mappedDeals: Deal[] = apiDeals.map(deal => ({
          id: deal.id,
          name: deal.name,
          description: deal.description,
          status: deal.status,
          address: deal.address,
          propertyType: deal.propertyType,
          unitCount: deal.unitCount,
          squareFootage: deal.squareFootage,
          currentValue: deal.currentValue,
          imageUrl: deal.imageUrl,
          kpis: null, // KPIs would come from a separate field if stored
          investorCount: deal.investorCount,
        }));
        
        // If we got real deals, use them; otherwise use mock data
        if (mappedDeals.length > 0) {
          setDeals(mappedDeals);
          setUsingMockData(false);
        } else {
          setDeals(mockDeals);
          setUsingMockData(true);
        }
      } catch (error) {
        console.log('Using mock data - API not available');
        setDeals(mockDeals);
        setUsingMockData(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDeals();
  }, []);

  const filteredDeals = deals.filter((deal) => {
    if (statusFilter !== 'all' && deal.status !== statusFilter) return false;
    if (propertyTypeFilter !== 'all' && deal.propertyType !== propertyTypeFilter) return false;
    return true;
  });

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All Status' },
    { value: 'prospective', label: 'Prospective' },
    { value: 'under_contract', label: 'Under Contract' },
    { value: 'acquired', label: 'Acquired' },
    { value: 'renovating', label: 'Renovating' },
    { value: 'stabilized', label: 'Stabilized' },
    { value: 'for_sale', label: 'For Sale' },
    { value: 'sold', label: 'Sold' },
  ];

  const propertyTypes: { value: PropertyTypeFilter; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'multifamily', label: 'Multifamily' },
    { value: 'office', label: 'Office' },
    { value: 'retail', label: 'Retail' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'other', label: 'Other' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deals</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your fund's real estate portfolio
          </p>
        </div>
        <Link to="/manager/deals/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Deal
          </Button>
        </Link>
      </div>

      {/* Demo Mode Banner */}
      {usingMockData && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950">
          <span className="font-medium text-amber-800 dark:text-amber-200">Demo Mode:</span>{' '}
          <span className="text-amber-600 dark:text-amber-400">
            Showing sample deals. Add a new deal to see it appear here.
          </span>
        </div>
      )}

      {/* Portfolio Summary KPIs */}
      <PortfolioSummary deals={deals} />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={propertyTypeFilter}
            onChange={(e) => setPropertyTypeFilter(e.target.value as PropertyTypeFilter)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            {propertyTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="ml-auto flex items-center gap-1 rounded-lg border p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'rounded p-1.5 transition-colors',
              viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'rounded p-1.5 transition-colors',
              viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>{filteredDeals.length} deal{filteredDeals.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Deals Grid/List */}
      {filteredDeals.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-semibold">No deals found</h3>
          <p className="mt-2 text-muted-foreground">
            Try adjusting your filters or add a new deal.
          </p>
          <Link to="/manager/deals/new">
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Deal
            </Button>
          </Link>
        </div>
      ) : (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
              : 'space-y-4'
          )}
        >
          {filteredDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}
    </div>
  );
}
