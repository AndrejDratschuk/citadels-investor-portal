import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { formatCurrency, formatDate, formatPercentage } from '@flowveda/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DealImageUpload } from '../components/DealImageUpload';
import { dealsApi, Deal } from '@/lib/api/deals';

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

const statusStyles: Record<string, string> = {
  prospective: 'bg-gray-100 text-gray-700',
  under_contract: 'bg-yellow-100 text-yellow-700',
  acquired: 'bg-blue-100 text-blue-700',
  renovating: 'bg-orange-100 text-orange-700',
  stabilized: 'bg-green-100 text-green-700',
  for_sale: 'bg-purple-100 text-purple-700',
  sold: 'bg-gray-100 text-gray-700',
};

type TabType = 'overview' | 'investors' | 'documents' | 'kpis';

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
          kpis: mockDeal.kpis, // Keep mock KPIs for now since they're not in the API response
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

  const config = propertyTypeConfig[deal.propertyType || 'other'] || propertyTypeConfig.other;

  const appreciation = deal.acquisitionPrice
    ? ((deal.currentValue! - deal.acquisitionPrice) / deal.acquisitionPrice) * 100
    : 0;

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'investors', label: 'Investors', count: mockInvestors.length },
    { id: 'documents', label: 'Documents', count: mockDocuments.length },
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
          <Button variant="outline" size="sm">
            <DollarSign className="mr-2 h-4 w-4" />
            Create Capital Call
          </Button>
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
          <p className="text-sm text-muted-foreground">Current Value</p>
          <p className="mt-1 text-2xl font-bold">{deal.currentValue ? formatCurrency(deal.currentValue) : '—'}</p>
          {deal.acquisitionPrice && (
            <p className="mt-1 text-sm text-green-600">
              +{appreciation.toFixed(1)}% since acquisition
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
        <div className="rounded-xl border bg-card">
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
        </div>
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

      {activeTab === 'kpis' && deal.kpis && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(deal.kpis).map(([key, value]) => (
            <div key={key} className="rounded-xl border bg-card p-4">
              <p className="text-sm text-muted-foreground capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </p>
              <p className="mt-1 text-2xl font-bold">
                {typeof value === 'number'
                  ? key.includes('Rate') || key.includes('cash')
                    ? `${(value * 100).toFixed(2)}%`
                    : formatCurrency(value)
                  : value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
