import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  MapPin,
  Edit,
  Users,
  FileText,
  DollarSign,
  MoreHorizontal,
  Building2,
  Factory,
  Store,
  Landmark,
  Home,
  AlertCircle,
  Save,
  Loader2,
  TrendingUp,
  Plus,
  BarChart3,
  CreditCard,
  Percent,
  Wallet,
  PiggyBank,
} from 'lucide-react';
import { formatCurrency, formatDate, formatPercentage } from '@altsui/shared';
import type { KpiCategory, KpiCardData, DealKpiSummary } from '@altsui/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { DealImageUpload } from '../components/DealImageUpload';
import { DealInvestorsModal } from '../components/DealInvestorsModal';
import { dealsApi, Deal, DealKPIs, DealInvestor } from '@/lib/api/deals';
import { dealKpisApi } from '@/lib/api/kpis';
import {
  KPICard,
  KPICardGrid,
  KPICategoryNav,
  KPITrendChart,
} from '../components/kpi';

// Property type gradients and icons for placeholder
const propertyTypeConfig: Record<string, { gradient: string; icon: React.ReactNode }> = {
  multifamily: {
    gradient: 'from-blue-600 to-indigo-700',
    icon: <Building2 className="h-8 w-8 text-white/80" />,
  },
  office: {
    gradient: 'from-slate-600 to-slate-800',
    icon: <Landmark className="h-8 w-8 text-white/80" />,
  },
  retail: {
    gradient: 'from-amber-500 to-orange-600',
    icon: <Store className="h-8 w-8 text-white/80" />,
  },
  industrial: {
    gradient: 'from-zinc-600 to-zinc-800',
    icon: <Factory className="h-8 w-8 text-white/80" />,
  },
  other: {
    gradient: 'from-purple-600 to-violet-700',
    icon: <Home className="h-8 w-8 text-white/80" />,
  },
};

// Mock data for display when API is not available
const mockDeal = {
  id: '1',
  fundId: '',
  name: 'Riverside Apartments',
  description: 'A 120-unit Class B multifamily property in a rapidly growing submarket with strong rent growth potential. The property features updated amenities including a fitness center, pool, and dog park.',
  status: 'stabilized' as const,
  address: {
    street: '456 Riverside Dr',
    city: 'Austin',
    state: 'TX',
    zip: '78702',
  },
  propertyType: 'multifamily' as const,
  unitCount: 120,
  squareFootage: 95000,
  acquisitionPrice: 12500000,
  acquisitionDate: '2023-06-15',
  currentValue: 14200000,
  totalInvestment: 13800000,
  imageUrl: null as string | null,
  createdAt: '',
  updatedAt: '',
  kpis: {
    noi: 985000,
    capRate: 0.0693,
    cashOnCash: 0.082,
    occupancyRate: 0.94,
    renovationBudget: 1500000,
    renovationSpent: 1200000,
  },
};

const mockInvestors = [
  { id: '1', name: 'John Smith', ownershipPercentage: 0.0192, investedAmount: 264960 },
  { id: '2', name: 'Sarah Johnson', ownershipPercentage: 0.0150, investedAmount: 207000 },
  { id: '3', name: 'Emily Davis', ownershipPercentage: 0.0180, investedAmount: 248400 },
  { id: '4', name: 'Robert Wilson', ownershipPercentage: 0.0120, investedAmount: 165600 },
];

const mockDocuments = [
  { id: '1', name: 'Purchase Agreement', type: 'other', createdAt: '2023-06-01' },
  { id: '2', name: 'Property Inspection Report', type: 'other', createdAt: '2023-06-05' },
  { id: '3', name: 'Q3 2024 Report', type: 'report', createdAt: '2024-10-15' },
];

// KPI Icon Mapping
const KPI_ICONS: Record<string, { icon: typeof DollarSign; color: string; bg: string }> = {
  gpr: { icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  egi: { icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-100' },
  total_revenue: { icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  revenue_per_unit: { icon: Building2, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  revenue_per_sqft: { icon: Building2, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  physical_occupancy: { icon: Home, color: 'text-blue-600', bg: 'bg-blue-100' },
  economic_occupancy: { icon: Home, color: 'text-blue-600', bg: 'bg-blue-100' },
  vacancy_rate: { icon: Home, color: 'text-orange-600', bg: 'bg-orange-100' },
  noi: { icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
  cap_rate: { icon: Percent, color: 'text-pink-600', bg: 'bg-pink-100' },
  cash_on_cash: { icon: PiggyBank, color: 'text-green-600', bg: 'bg-green-100' },
  ebitda: { icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  roi: { icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  irr: { icon: Percent, color: 'text-pink-600', bg: 'bg-pink-100' },
  dscr: { icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-100' },
  ltv: { icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-100' },
  principal_balance: { icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-100' },
};

const DEFAULT_ICON = { icon: BarChart3, color: 'text-slate-600', bg: 'bg-slate-100' };

function getKpiIcon(code: string) {
  return KPI_ICONS[code] || DEFAULT_ICON;
}

// Mock KPI Summary Data
const MOCK_KPI_SUMMARY: DealKpiSummary = {
  dealId: '1',
  dealName: 'Riverside Apartments',
  featured: [
    { id: '1', code: 'noi', name: 'NOI', value: '$985K', rawValue: 985000, change: 12, changeLabel: 'vs Last Month', format: 'currency', category: 'property_performance' },
    { id: '2', code: 'cap_rate', name: 'Cap Rate', value: '6.93%', rawValue: 0.0693, change: 5, changeLabel: 'vs Last Month', format: 'percentage', category: 'property_performance' },
    { id: '3', code: 'physical_occupancy', name: 'Occupancy', value: '94%', rawValue: 0.94, change: -2, changeLabel: 'vs Last Month', format: 'percentage', category: 'occupancy' },
    { id: '4', code: 'dscr', name: 'DSCR', value: '1.45x', rawValue: 1.45, change: 8, changeLabel: 'vs Last Month', format: 'ratio', category: 'debt_service' },
    { id: '5', code: 'gpr', name: 'GPR', value: '$125K', rawValue: 125000, change: 10, changeLabel: 'vs Last Month', format: 'currency', category: 'rent_revenue' },
    { id: '6', code: 'egi', name: 'EGI', value: '$118K', rawValue: 118000, change: 9, changeLabel: 'vs Last Month', format: 'currency', category: 'rent_revenue' },
  ],
  byCategory: {
    rent_revenue: [],
    occupancy: [],
    property_performance: [],
    financial: [],
    debt_service: [],
  },
  lastUpdated: new Date().toISOString(),
};

// Mock Chart Data for NOI Trend
const MOCK_CHART_DATA = [
  { date: '2024-01', label: 'Jan', actual: 920000, forecast: null, budget: null },
  { date: '2024-02', label: 'Feb', actual: 935000, forecast: null, budget: null },
  { date: '2024-03', label: 'Mar', actual: 948000, forecast: null, budget: null },
  { date: '2024-04', label: 'Apr', actual: 955000, forecast: null, budget: null },
  { date: '2024-05', label: 'May', actual: 960000, forecast: null, budget: null },
  { date: '2024-06', label: 'Jun', actual: 945000, forecast: null, budget: null },
  { date: '2024-07', label: 'Jul', actual: 968000, forecast: null, budget: null },
  { date: '2024-08', label: 'Aug', actual: 975000, forecast: null, budget: null },
  { date: '2024-09', label: 'Sep', actual: 980000, forecast: null, budget: null },
  { date: '2024-10', label: 'Oct', actual: 985000, forecast: null, budget: null },
];

const statusStyles: Record<string, string> = {
  prospective: 'bg-gray-100 text-gray-700',
  under_contract: 'bg-yellow-100 text-yellow-700',
  acquired: 'bg-blue-100 text-blue-700',
  renovating: 'bg-orange-100 text-orange-700',
  stabilized: 'bg-green-100 text-green-700',
  for_sale: 'bg-purple-100 text-purple-700',
  sold: 'bg-gray-100 text-gray-700',
};

type TabType = 'overview' | 'investors' | 'documents' | 'financials' | 'kpis';

interface DealWithKpis extends Deal {
  kpis?: {
    noi?: number;
    capRate?: number;
    cashOnCash?: number;
    occupancyRate?: number;
    renovationBudget?: number;
    renovationSpent?: number;
  };
  totalInvestment?: number;
}

export function DealDetail() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [deal, setDeal] = useState<DealWithKpis>(mockDeal);
  const [isRealDeal, setIsRealDeal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dealInvestors, setDealInvestors] = useState<DealInvestor[]>([]);
  const [isLoadingInvestors, setIsLoadingInvestors] = useState(false);
  const [showInvestorsModal, setShowInvestorsModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<KpiCategory | 'all'>('all');

  // Fetch KPI summary for financials tab
  const { data: kpiSummary, isLoading: isKpiLoading } = useQuery({
    queryKey: ['deal-kpi-summary', id],
    queryFn: () => dealKpisApi.getSummary(id!, deal?.name),
    enabled: !!id && activeTab === 'financials',
  });

  // Use mock data if API returns empty or fails
  const displayKpiSummary = kpiSummary?.featured?.length ? kpiSummary : MOCK_KPI_SUMMARY;

  // Filter KPIs by selected category
  const filteredKpis = selectedCategory === 'all'
    ? displayKpiSummary.featured
    : displayKpiSummary.featured.filter((kpi: KpiCardData) => kpi.category === selectedCategory);

  // Handle category selection (stays in-tab, no navigation)
  const handleCategoryChange = (category: KpiCategory | 'all') => {
    setSelectedCategory(category);
  };

  // Fetch real deal from API
  useEffect(() => {
    async function fetchDeal() {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const realDeal = await dealsApi.getById(id);
        setDeal({
          ...realDeal,
          // Use real KPIs if available, otherwise keep mock for demo
          kpis: realDeal.kpis || mockDeal.kpis,
          totalInvestment: mockDeal.totalInvestment,
        });
        setIsRealDeal(true);
      } catch (error) {
        console.log('Using mock data - deal not found in database');
        // Keep using mock data
        setIsRealDeal(false);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDeal();
  }, [id]);

  // Fetch deal investors
  const fetchDealInvestors = async () => {
    if (!id || !isRealDeal) return;
    
    setIsLoadingInvestors(true);
    try {
      const investors = await dealsApi.getDealInvestors(id);
      setDealInvestors(investors);
    } catch (error) {
      console.error('Failed to fetch deal investors:', error);
    } finally {
      setIsLoadingInvestors(false);
    }
  };

  useEffect(() => {
    if (isRealDeal && id) {
      fetchDealInvestors();
    }
  }, [isRealDeal, id]);

  const config = propertyTypeConfig[deal.propertyType || 'other'] || propertyTypeConfig.other;

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'investors', label: 'Investors', count: isRealDeal ? dealInvestors.length : mockInvestors.length },
    { id: 'documents', label: 'Documents', count: mockDocuments.length },
    { id: 'financials', label: 'Financials' },
    { id: 'kpis', label: 'KPIs' },
  ];

  const handleImageUpload = async (file: File) => {
    if (!id || !isRealDeal) return;
    try {
      const { imageUrl } = await dealsApi.uploadImage(id, file);
      setDeal(prev => ({ ...prev, imageUrl }));
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw error;
    }
  };

  const handleImageDelete = async () => {
    if (!id || !isRealDeal) return;
    try {
      await dealsApi.deleteImage(id);
      setDeal(prev => ({ ...prev, imageUrl: null }));
    } catch (error) {
      console.error('Failed to delete image:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading deal...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/manager/deals">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Deals
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          {/* Deal Image or Placeholder */}
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl">
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
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{deal.name}</h1>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                  statusStyles[deal.status]
                )}
              >
                {deal.status.replace(/_/g, ' ')}
              </span>
            </div>
            {deal.address && (
              <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {deal.address.street}, {deal.address.city}, {deal.address.state} {deal.address.zip}
                </span>
              </div>
            )}
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="capitalize">{deal.propertyType}</span>
              {deal.unitCount && <span>{deal.unitCount} units</span>}
              {deal.squareFootage && <span>{deal.squareFootage.toLocaleString()} sq ft</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/manager/capital-calls/new?dealId=${id}`}>
            <Button variant="outline" size="sm">
              <DollarSign className="mr-2 h-4 w-4" />
              Create Capital Call
            </Button>
          </Link>
          <Link to={`/manager/deals/${id}/edit`}>
            <Button size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit Deal
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Acquisition Price</p>
          <p className="mt-1 text-2xl font-bold">{deal.acquisitionPrice ? formatCurrency(deal.acquisitionPrice) : '—'}</p>
          {deal.acquisitionDate && (
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(deal.acquisitionDate)}
            </p>
          )}
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">NOI</p>
          <p className="mt-1 text-2xl font-bold">{deal.kpis?.noi ? formatCurrency(deal.kpis.noi) : '—'}</p>
          <p className="mt-1 text-sm text-muted-foreground">Annual</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Cap Rate</p>
          <p className="mt-1 text-2xl font-bold">{deal.kpis?.capRate ? `${(deal.kpis.capRate * 100).toFixed(2)}%` : '—'}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Occupancy</p>
          <p className="mt-1 text-2xl font-bold">{deal.kpis?.occupancyRate ? `${(deal.kpis.occupancyRate * 100).toFixed(0)}%` : '—'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Deal Image Section */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold">Deal Image</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload a primary image to represent this deal
            </p>
            <div className="mt-4">
              {isRealDeal ? (
                <DealImageUpload
                  imageUrl={deal.imageUrl}
                  propertyType={deal.propertyType}
                  onUpload={handleImageUpload}
                  onDelete={handleImageDelete}
                />
              ) : (
                <div className="space-y-4">
                  <DealImageUpload
                    imageUrl={deal.imageUrl}
                    propertyType={deal.propertyType}
                    onUpload={async () => {}}
                    onDelete={async () => {}}
                  />
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800 dark:text-amber-200">Demo Mode</p>
                      <p className="text-amber-600 dark:text-amber-400">
                        This is sample data. Image upload is available for deals saved in the database.
                        Create a new deal to enable image uploads.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold">Property Details</h3>
            <p className="mt-3 text-muted-foreground">{deal.description}</p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Acquisition Date</span>
                <span>{deal.acquisitionDate ? formatDate(deal.acquisitionDate) : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Acquisition Price</span>
                <span>{deal.acquisitionPrice ? formatCurrency(deal.acquisitionPrice) : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Investment</span>
                <span>{deal.totalInvestment ? formatCurrency(deal.totalInvestment) : '—'}</span>
              </div>
            </div>
          </div>

          {deal.kpis?.renovationBudget && (
            <div className="rounded-xl border bg-card p-6 lg:col-span-2">
              <h3 className="font-semibold">Renovation Progress</h3>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Budget Used</span>
                  <span className="font-medium">
                    {((deal.kpis.renovationSpent! / deal.kpis.renovationBudget) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
                    style={{
                      width: `${(deal.kpis.renovationSpent! / deal.kpis.renovationBudget) * 100}%`,
                    }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span>{formatCurrency(deal.kpis.renovationSpent!)}</span>
                  <span className="text-muted-foreground">
                    of {formatCurrency(deal.kpis.renovationBudget)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'investors' && (
        <div className="space-y-4">
          {/* Header with Add Button */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Deal Investors</h3>
              <p className="text-sm text-muted-foreground">
                Investors who are invested in this deal
              </p>
            </div>
            {isRealDeal && (
              <Button onClick={() => setShowInvestorsModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Manage Investors
              </Button>
            )}
          </div>

          {/* Investors List */}
          <div className="rounded-xl border bg-card">
            {isLoadingInvestors ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (isRealDeal ? dealInvestors : mockInvestors).length === 0 ? (
              <div className="p-8 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-3 font-medium">No investors yet</p>
                <p className="text-sm text-muted-foreground">
                  {isRealDeal 
                    ? 'Click "Manage Investors" to add investors to this deal'
                    : 'Investors will appear here once assigned to this deal'}
                </p>
              </div>
            ) : isRealDeal ? (
              <div className="divide-y">
                {dealInvestors.map((investor) => (
                  <div
                    key={investor.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <Link
                          to={`/manager/investors/${investor.id}`}
                          className="font-medium hover:underline"
                        >
                          {investor.firstName} {investor.lastName}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {formatPercentage(investor.ownershipPercentage)} ownership
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(investor.commitmentAmount * investor.ownershipPercentage)}
                      </p>
                      <p className="text-sm text-muted-foreground">Invested</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y">
                {mockInvestors.map((investor) => (
                  <div
                    key={investor.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <Link
                          to={`/manager/investors/${investor.id}`}
                          className="font-medium hover:underline"
                        >
                          {investor.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {formatPercentage(investor.ownershipPercentage)} ownership
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(investor.investedAmount)}</p>
                      <p className="text-sm text-muted-foreground">Invested</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Investors Modal */}
      {id && (
        <DealInvestorsModal
          isOpen={showInvestorsModal}
          onClose={() => {
            setShowInvestorsModal(false);
            // Refresh investors after modal closes
            fetchDealInvestors();
          }}
          dealId={id}
          dealName={deal.name}
        />
      )}

      {activeTab === 'documents' && (
        <div className="rounded-xl border bg-card">
          <div className="divide-y">
            {mockDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {doc.type} • {formatDate(doc.createdAt)}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'financials' && (
        <div className="space-y-6">
          {/* Row 1: Category Navigation (at top for easy navigation) */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold mb-4">Browse by Category</h2>
            <KPICategoryNav
              selected={selectedCategory}
              onChange={handleCategoryChange}
            />
          </div>

          {/* Row 2: Featured KPIs (filtered by category) */}
          {isKpiLoading ? (
            <KPICardGrid columns={6}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-4">
                  <Skeleton className="h-8 w-8 rounded-lg mb-2" />
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </KPICardGrid>
          ) : filteredKpis.length > 0 ? (
            <KPICardGrid columns={filteredKpis.length >= 6 ? 6 : filteredKpis.length as 2 | 4 | 6}>
              {filteredKpis.map((kpi: KpiCardData) => {
                const iconConfig = getKpiIcon(kpi.code);
                return (
                  <KPICard
                    key={kpi.id}
                    title={kpi.name}
                    value={kpi.value}
                    icon={iconConfig.icon}
                    iconColor={iconConfig.color}
                    iconBg={iconConfig.bg}
                    change={kpi.change}
                    changeLabel={kpi.changeLabel}
                  />
                );
              })}
            </KPICardGrid>
          ) : (
            <div className="rounded-xl border bg-card p-8 text-center">
              <p className="text-muted-foreground">No KPIs available for this category</p>
            </div>
          )}

          {/* Row 3: Trend Chart */}
          <KPITrendChart
            title="Monthly NOI Performance"
            data={MOCK_CHART_DATA}
            isLoading={isKpiLoading}
            format="currency"
          />

          {/* Row 4: Financial Statements Link */}
          <Link to={`/manager/deals/${id}/financials/statements`}>
            <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                    <FileText className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Financial Statements</h3>
                    <p className="text-sm text-muted-foreground">
                      View Income Statement, Balance Sheet, and Cash Flow
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View Statements
                </Button>
              </div>
            </div>
          </Link>
        </div>
      )}

      {activeTab === 'kpis' && (
        <KPIsEditor
          deal={deal}
          isRealDeal={isRealDeal}
          onUpdate={(updatedDeal) => setDeal(updatedDeal)}
        />
      )}
    </div>
  );
}

// KPIs Editor Component
interface KPIsEditorProps {
  deal: DealWithKpis;
  isRealDeal: boolean;
  onUpdate: (deal: DealWithKpis) => void;
}

function KPIsEditor({ deal, isRealDeal, onUpdate }: KPIsEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [acquisitionPrice, setAcquisitionPrice] = useState(deal.acquisitionPrice?.toString() || '');
  const [acquisitionDate, setAcquisitionDate] = useState(deal.acquisitionDate || '');
  const [currentValue, setCurrentValue] = useState(deal.currentValue?.toString() || '');
  const [noi, setNoi] = useState(deal.kpis?.noi?.toString() || '');
  const [capRate, setCapRate] = useState(deal.kpis?.capRate ? (deal.kpis.capRate * 100).toString() : '');
  const [cashOnCash, setCashOnCash] = useState(deal.kpis?.cashOnCash ? (deal.kpis.cashOnCash * 100).toString() : '');
  const [occupancyRate, setOccupancyRate] = useState(deal.kpis?.occupancyRate ? (deal.kpis.occupancyRate * 100).toString() : '');
  const [renovationBudget, setRenovationBudget] = useState(deal.kpis?.renovationBudget?.toString() || '');
  const [renovationSpent, setRenovationSpent] = useState(deal.kpis?.renovationSpent?.toString() || '');

  const appreciation = deal.acquisitionPrice && deal.currentValue
    ? ((deal.currentValue - deal.acquisitionPrice) / deal.acquisitionPrice) * 100
    : 0;

  const handleSave = async () => {
    if (!isRealDeal) {
      setError('Cannot save KPIs for demo deals. Create a real deal first.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const kpis: DealKPIs = {};
      if (noi) kpis.noi = parseFloat(noi);
      if (capRate) kpis.capRate = parseFloat(capRate) / 100;
      if (cashOnCash) kpis.cashOnCash = parseFloat(cashOnCash) / 100;
      if (occupancyRate) kpis.occupancyRate = parseFloat(occupancyRate) / 100;
      if (renovationBudget) kpis.renovationBudget = parseFloat(renovationBudget);
      if (renovationSpent) kpis.renovationSpent = parseFloat(renovationSpent);

      await dealsApi.update(deal.id, {
        acquisitionPrice: acquisitionPrice ? parseFloat(acquisitionPrice) : undefined,
        acquisitionDate: acquisitionDate || undefined,
        currentValue: currentValue ? parseFloat(currentValue) : undefined,
        kpis: Object.keys(kpis).length > 0 ? kpis : undefined,
      });

      // Update local state
      onUpdate({
        ...deal,
        acquisitionPrice: acquisitionPrice ? parseFloat(acquisitionPrice) : null,
        acquisitionDate: acquisitionDate || null,
        currentValue: currentValue ? parseFloat(currentValue) : null,
        kpis: Object.keys(kpis).length > 0 ? kpis : deal.kpis,
      });

      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to save KPIs:', err);
      setError(err.message || 'Failed to save KPIs. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form state
    setAcquisitionPrice(deal.acquisitionPrice?.toString() || '');
    setAcquisitionDate(deal.acquisitionDate || '');
    setCurrentValue(deal.currentValue?.toString() || '');
    setNoi(deal.kpis?.noi?.toString() || '');
    setCapRate(deal.kpis?.capRate ? (deal.kpis.capRate * 100).toString() : '');
    setCashOnCash(deal.kpis?.cashOnCash ? (deal.kpis.cashOnCash * 100).toString() : '');
    setOccupancyRate(deal.kpis?.occupancyRate ? (deal.kpis.occupancyRate * 100).toString() : '');
    setRenovationBudget(deal.kpis?.renovationBudget?.toString() || '');
    setRenovationSpent(deal.kpis?.renovationSpent?.toString() || '');
    setIsEditing(false);
    setError(null);
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Key Performance Indicators</h3>
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit KPIs
          </Button>
        </div>

        {/* Valuation Summary - Featured */}
        <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Acquisition Info */}
            <div>
              <p className="text-sm font-medium text-primary/60">Acquisition Price</p>
              <p className="mt-1 text-2xl font-bold">{deal.acquisitionPrice ? formatCurrency(deal.acquisitionPrice) : '—'}</p>
              {deal.acquisitionDate && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(deal.acquisitionDate)}
                </p>
              )}
            </div>
            {/* Current Value */}
            <div>
              <p className="text-sm font-medium text-primary/80">Current Value (AUM)</p>
              <p className="mt-1 text-2xl font-bold">{deal.currentValue ? formatCurrency(deal.currentValue) : '—'}</p>
              {deal.acquisitionPrice && deal.currentValue && (
                <p className={cn(
                  'mt-1 text-sm font-medium',
                  appreciation >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {appreciation >= 0 ? '+' : ''}{appreciation.toFixed(1)}% appreciation
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Other KPIs Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">NOI (Annual)</p>
            <p className="mt-1 text-2xl font-bold">{deal.kpis?.noi ? formatCurrency(deal.kpis.noi) : '—'}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Cap Rate</p>
            <p className="mt-1 text-2xl font-bold">{deal.kpis?.capRate ? `${(deal.kpis.capRate * 100).toFixed(2)}%` : '—'}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Cash on Cash</p>
            <p className="mt-1 text-2xl font-bold">{deal.kpis?.cashOnCash ? `${(deal.kpis.cashOnCash * 100).toFixed(2)}%` : '—'}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Occupancy Rate</p>
            <p className="mt-1 text-2xl font-bold">{deal.kpis?.occupancyRate ? `${(deal.kpis.occupancyRate * 100).toFixed(0)}%` : '—'}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Renovation Budget</p>
            <p className="mt-1 text-2xl font-bold">{deal.kpis?.renovationBudget ? formatCurrency(deal.kpis.renovationBudget) : '—'}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Renovation Spent</p>
            <p className="mt-1 text-2xl font-bold">{deal.kpis?.renovationSpent ? formatCurrency(deal.kpis.renovationSpent) : '—'}</p>
          </div>
        </div>

        {!isRealDeal && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">Demo Mode</p>
              <p className="text-amber-600 dark:text-amber-400">
                This is sample data. KPIs can only be edited for deals saved in the database.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Edit Mode
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Edit KPIs</h3>
        <div className="flex gap-2">
          <Button onClick={handleCancel} variant="outline" size="sm" disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} size="sm" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save KPIs
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-xl border bg-card p-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Acquisition Price */}
          <div>
            <Label htmlFor="acquisitionPrice" className="text-base font-medium">Acquisition Price</Label>
            <Input
              id="acquisitionPrice"
              type="number"
              value={acquisitionPrice}
              onChange={(e) => setAcquisitionPrice(e.target.value)}
              placeholder="e.g. 12500000"
              className="mt-2"
            />
          </div>

          {/* Acquisition Date */}
          <div>
            <Label htmlFor="acquisitionDate" className="text-base font-medium">Acquisition Date</Label>
            <Input
              id="acquisitionDate"
              type="date"
              value={acquisitionDate}
              onChange={(e) => setAcquisitionDate(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Current Value */}
          <div>
            <Label htmlFor="currentValue" className="text-base font-medium">Current Value (AUM)</Label>
            <Input
              id="currentValue"
              type="number"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              placeholder="e.g. 14200000"
              className="mt-2"
            />
          </div>

          {/* Divider */}
          <div className="sm:col-span-2 lg:col-span-3 border-t pt-4">
            <p className="text-sm font-medium text-muted-foreground">Performance Metrics</p>
          </div>

          {/* NOI */}
          <div>
            <Label htmlFor="noi">NOI (Annual)</Label>
            <Input
              id="noi"
              type="number"
              value={noi}
              onChange={(e) => setNoi(e.target.value)}
              placeholder="e.g. 985000"
              className="mt-2"
            />
          </div>

          {/* Cap Rate */}
          <div>
            <Label htmlFor="capRate">Cap Rate (%)</Label>
            <Input
              id="capRate"
              type="number"
              step="0.01"
              value={capRate}
              onChange={(e) => setCapRate(e.target.value)}
              placeholder="e.g. 6.93"
              className="mt-2"
            />
          </div>

          {/* Cash on Cash */}
          <div>
            <Label htmlFor="cashOnCash">Cash on Cash (%)</Label>
            <Input
              id="cashOnCash"
              type="number"
              step="0.01"
              value={cashOnCash}
              onChange={(e) => setCashOnCash(e.target.value)}
              placeholder="e.g. 8.2"
              className="mt-2"
            />
          </div>

          {/* Occupancy Rate */}
          <div>
            <Label htmlFor="occupancyRate">Occupancy Rate (%)</Label>
            <Input
              id="occupancyRate"
              type="number"
              step="1"
              value={occupancyRate}
              onChange={(e) => setOccupancyRate(e.target.value)}
              placeholder="e.g. 94"
              className="mt-2"
            />
          </div>

          {/* Renovation Budget */}
          <div>
            <Label htmlFor="renovationBudget">Renovation Budget</Label>
            <Input
              id="renovationBudget"
              type="number"
              value={renovationBudget}
              onChange={(e) => setRenovationBudget(e.target.value)}
              placeholder="e.g. 1500000"
              className="mt-2"
            />
          </div>

          {/* Renovation Spent */}
          <div>
            <Label htmlFor="renovationSpent">Renovation Spent</Label>
            <Input
              id="renovationSpent"
              type="number"
              value={renovationSpent}
              onChange={(e) => setRenovationSpent(e.target.value)}
              placeholder="e.g. 1200000"
              className="mt-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
