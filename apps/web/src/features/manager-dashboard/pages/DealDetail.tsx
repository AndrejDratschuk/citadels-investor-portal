import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Edit,
  TrendingUp,
  Users,
  FileText,
  DollarSign,
  MoreHorizontal,
} from 'lucide-react';
import { formatCurrency, formatDate, formatPercentage } from '@flowveda/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Mock data
const mockDeal = {
  id: '1',
  name: 'Riverside Apartments',
  description: 'A 120-unit Class B multifamily property in a rapidly growing submarket with strong rent growth potential. The property features updated amenities including a fitness center, pool, and dog park.',
  status: 'stabilized' as const,
  address: {
    street: '456 Riverside Dr',
    city: 'Austin',
    state: 'TX',
    zip: '78702',
  },
  propertyType: 'multifamily',
  unitCount: 120,
  squareFootage: 95000,
  acquisitionPrice: 12500000,
  acquisitionDate: '2023-06-15',
  currentValue: 14200000,
  totalInvestment: 13800000,
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

export function DealDetail() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const deal = mockDeal;
  const appreciation = deal.acquisitionPrice
    ? ((deal.currentValue - deal.acquisitionPrice) / deal.acquisitionPrice) * 100
    : 0;

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'investors', label: 'Investors', count: mockInvestors.length },
    { id: 'documents', label: 'Documents', count: mockDocuments.length },
    { id: 'kpis', label: 'KPIs' },
  ];

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
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl">
            🏢
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
          <p className="mt-1 text-2xl font-bold">{formatCurrency(deal.currentValue)}</p>
          <p className="mt-1 text-sm text-green-600">
            +{appreciation.toFixed(1)}% since acquisition
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">NOI</p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(deal.kpis.noi)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Annual</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Cap Rate</p>
          <p className="mt-1 text-2xl font-bold">{(deal.kpis.capRate * 100).toFixed(2)}%</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Occupancy</p>
          <p className="mt-1 text-2xl font-bold">{(deal.kpis.occupancyRate * 100).toFixed(0)}%</p>
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
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold">Property Details</h3>
            <p className="mt-3 text-muted-foreground">{deal.description}</p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Acquisition Date</span>
                <span>{formatDate(deal.acquisitionDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Acquisition Price</span>
                <span>{formatCurrency(deal.acquisitionPrice)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Investment</span>
                <span>{formatCurrency(deal.totalInvestment)}</span>
              </div>
            </div>
          </div>

          {deal.kpis.renovationBudget && (
            <div className="rounded-xl border bg-card p-6">
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

      {activeTab === 'kpis' && (
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


