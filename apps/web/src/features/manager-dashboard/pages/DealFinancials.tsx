/**
 * Deal Financials Page (Level 2)
 * Displays featured KPIs, trend chart, and category navigation
 */

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  DollarSign,
  Home,
  TrendingUp,
  BarChart3,
  CreditCard,
  Percent,
  Building2,
  Wallet,
  PiggyBank,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { dealKpisApi } from '@/lib/api/kpis';
import { dealsApi } from '@/lib/api/deals';
import {
  KPICard,
  KPICardGrid,
  KPICategoryNav,
  KPITrendChart,
} from '../components/kpi';
import type { KpiCategoryNavOption } from '../components/kpi';
import type { KpiCardData, DealKpiSummary } from '@altsui/shared';

// ============================================
// Icon Mapping for KPIs
// ============================================
const KPI_ICONS: Record<string, { icon: typeof DollarSign; color: string; bg: string }> = {
  // Rent/Revenue
  gpr: { icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  egi: { icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-100' },
  total_revenue: { icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  revenue_per_unit: { icon: Building2, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  revenue_per_sqft: { icon: Building2, color: 'text-cyan-600', bg: 'bg-cyan-100' },

  // Occupancy
  physical_occupancy: { icon: Home, color: 'text-blue-600', bg: 'bg-blue-100' },
  economic_occupancy: { icon: Home, color: 'text-blue-600', bg: 'bg-blue-100' },
  vacancy_rate: { icon: Home, color: 'text-orange-600', bg: 'bg-orange-100' },

  // Property Performance
  noi: { icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
  cap_rate: { icon: Percent, color: 'text-pink-600', bg: 'bg-pink-100' },
  cash_on_cash: { icon: PiggyBank, color: 'text-green-600', bg: 'bg-green-100' },

  // Financial
  ebitda: { icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  roi: { icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  irr: { icon: Percent, color: 'text-pink-600', bg: 'bg-pink-100' },

  // Debt Service
  dscr: { icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-100' },
  ltv: { icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-100' },
  principal_balance: { icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-100' },
};

const DEFAULT_ICON = { icon: BarChart3, color: 'text-slate-600', bg: 'bg-slate-100' };

function getKpiIcon(code: string) {
  return KPI_ICONS[code] || DEFAULT_ICON;
}

// ============================================
// Mock Data (for demo when API not available)
// ============================================
const MOCK_SUMMARY: DealKpiSummary = {
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

// ============================================
// Component
// ============================================
export function DealFinancials(): JSX.Element {
  const { id: dealId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<KpiCategoryNavOption>('all');

  // Fetch deal info
  const { data: deal, isLoading: isDealLoading } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: () => dealsApi.getById(dealId!),
    enabled: !!dealId,
  });

  // Fetch KPI summary
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['deal-kpi-summary', dealId],
    queryFn: () => dealKpisApi.getSummary(dealId!, deal?.name),
    enabled: !!dealId,
  });

  // Use mock data if API returns empty or fails
  const displaySummary = summary?.featured?.length ? summary : MOCK_SUMMARY;
  const isLoading = isDealLoading || isSummaryLoading;

  // Handle category change - navigate to category view
  const handleCategoryChange = (category: KpiCategoryNavOption): void => {
    if (category === 'all') {
      setSelectedCategory('all');
    } else if (category === 'outliers') {
      navigate(`/manager/deals/${dealId}/financials/outliers`);
    } else {
      navigate(`/manager/deals/${dealId}/financials/category/${category}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to={`/manager/deals/${dealId}`}>
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Deal
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Deal Financials</h1>
          {deal && (
            <p className="text-sm text-muted-foreground mt-1">{deal.name}</p>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          Last updated: {displaySummary.lastUpdated 
            ? new Date(displaySummary.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '—'}
        </span>
      </div>

      {/* Row 1: Featured KPIs */}
      <KPICardGrid columns={6}>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4">
              <Skeleton className="h-8 w-8 rounded-lg mb-2" />
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))
        ) : (
          displaySummary.featured.map((kpi: KpiCardData) => {
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
          })
        )}
      </KPICardGrid>

      {/* Row 2: Trend Chart */}
      <KPITrendChart
        title="Monthly NOI Performance"
        data={MOCK_CHART_DATA}
        isLoading={isLoading}
        format="currency"
      />

      {/* Row 3: Category Navigation */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="font-semibold mb-4">Browse by Category</h2>
        <KPICategoryNav
          selected={selectedCategory}
          onChange={handleCategoryChange}
        />
      </div>

      {/* Row 4: Financial Statements Link */}
      <Link to={`/manager/deals/${dealId}/financials/statements`}>
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
  );
}

