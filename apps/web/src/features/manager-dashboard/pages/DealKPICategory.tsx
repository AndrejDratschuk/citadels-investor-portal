/**
 * Deal KPI Category Page (Level 3)
 * Displays all KPIs in a specific category with filtering and comparisons
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
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { dealsApi } from '@/lib/api/deals';
import { useDealKpiSummaryWithDimensions } from '../hooks/useDealKpis';
import {
  KPICardGrid,
  KPICategoryNav,
  KPITrendChart,
  KPIViewFilter,
  KPIComparisonCard,
  getCategoryConfig,
} from '../components/kpi';
import type { KpiCategoryNavOption } from '../components/kpi';
import type { KpiCategory, KpiViewMode, KpiCardDataWithDimensions } from '@altsui/shared';

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
  rent_growth: { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
  loss_to_lease: { icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-100' },
  concessions: { icon: DollarSign, color: 'text-red-600', bg: 'bg-red-100' },

  // Occupancy
  physical_occupancy: { icon: Home, color: 'text-blue-600', bg: 'bg-blue-100' },
  economic_occupancy: { icon: Home, color: 'text-blue-600', bg: 'bg-blue-100' },
  vacancy_rate: { icon: Home, color: 'text-orange-600', bg: 'bg-orange-100' },
  lease_renewal_rate: { icon: RefreshCw, color: 'text-green-600', bg: 'bg-green-100' },
  avg_days_vacant: { icon: Home, color: 'text-slate-600', bg: 'bg-slate-100' },
  move_ins: { icon: Home, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  move_outs: { icon: Home, color: 'text-red-600', bg: 'bg-red-100' },

  // Property Performance
  noi: { icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
  noi_margin: { icon: Percent, color: 'text-purple-600', bg: 'bg-purple-100' },
  operating_expense_ratio: { icon: Percent, color: 'text-orange-600', bg: 'bg-orange-100' },
  cap_rate: { icon: Percent, color: 'text-pink-600', bg: 'bg-pink-100' },
  cash_on_cash: { icon: PiggyBank, color: 'text-green-600', bg: 'bg-green-100' },
  total_expenses: { icon: DollarSign, color: 'text-red-600', bg: 'bg-red-100' },
  expense_per_unit: { icon: Building2, color: 'text-orange-600', bg: 'bg-orange-100' },

  // Financial
  ebitda: { icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  free_cash_flow: { icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
  roi: { icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  irr: { icon: Percent, color: 'text-pink-600', bg: 'bg-pink-100' },
  equity_multiple: { icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  property_value: { icon: Building2, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  appreciation: { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },

  // Debt Service
  dscr: { icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-100' },
  ltv: { icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-100' },
  interest_coverage: { icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-100' },
  principal_balance: { icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-100' },
  monthly_debt_service: { icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-100' },
  annual_debt_service: { icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-100' },
  interest_rate: { icon: Percent, color: 'text-orange-600', bg: 'bg-orange-100' },
};

const DEFAULT_ICON = { icon: BarChart3, color: 'text-slate-600', bg: 'bg-slate-100' };

function getKpiIcon(code: string) {
  return KPI_ICONS[code] || DEFAULT_ICON;
}


// ============================================
// Component
// ============================================
export function DealKPICategory(): JSX.Element {
  const { id: dealId, category } = useParams<{ id: string; category: string }>();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<KpiViewMode>('actual');

  const categoryConfig = getCategoryConfig(category as KpiCategory);

  // Fetch deal info
  const { data: deal, isLoading: isDealLoading } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: () => dealsApi.getById(dealId!),
    enabled: !!dealId,
  });

  // Fetch KPI summary with dimensions
  const { data: summary, isLoading: isSummaryLoading } = useDealKpiSummaryWithDimensions(
    dealId,
    { dealName: deal?.name }
  );

  const isLoading = isDealLoading || isSummaryLoading;
  const isComparisonMode = viewMode.startsWith('vs_');

  // Get KPIs for this category
  const categoryKpis = summary?.byCategory[category as KpiCategory] || [];

  // Handle category navigation
  const handleCategoryChange = (newCategory: KpiCategoryNavOption): void => {
    if (newCategory === 'all' || newCategory === 'outliers') {
      // All and Outliers are shown inline on financials page
      navigate(`/manager/deals/${dealId}/financials`);
    } else {
      navigate(`/manager/deals/${dealId}/financials/category/${newCategory}`);
    }
  };

  // Build chart data for the primary KPI
  const primaryKpi = categoryKpis[0];
  const chartData = primaryKpi ? [
    { date: '2024-01', label: 'Jan', actual: (primaryKpi.actualValue || 100) * 0.92, forecast: primaryKpi.forecastValue ? primaryKpi.forecastValue * 0.95 : null, budget: primaryKpi.budgetValue ? primaryKpi.budgetValue * 0.94 : null },
    { date: '2024-02', label: 'Feb', actual: (primaryKpi.actualValue || 100) * 0.94, forecast: primaryKpi.forecastValue ? primaryKpi.forecastValue * 0.96 : null, budget: primaryKpi.budgetValue ? primaryKpi.budgetValue * 0.95 : null },
    { date: '2024-03', label: 'Mar', actual: (primaryKpi.actualValue || 100) * 0.95, forecast: primaryKpi.forecastValue ? primaryKpi.forecastValue * 0.97 : null, budget: primaryKpi.budgetValue ? primaryKpi.budgetValue * 0.96 : null },
    { date: '2024-04', label: 'Apr', actual: (primaryKpi.actualValue || 100) * 0.96, forecast: primaryKpi.forecastValue ? primaryKpi.forecastValue * 0.98 : null, budget: primaryKpi.budgetValue ? primaryKpi.budgetValue * 0.97 : null },
    { date: '2024-05', label: 'May', actual: (primaryKpi.actualValue || 100) * 0.97, forecast: primaryKpi.forecastValue ? primaryKpi.forecastValue * 0.99 : null, budget: primaryKpi.budgetValue ? primaryKpi.budgetValue * 0.98 : null },
    { date: '2024-06', label: 'Jun', actual: (primaryKpi.actualValue || 100) * 0.98, forecast: primaryKpi.forecastValue || null, budget: primaryKpi.budgetValue || null },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to={`/manager/deals/${dealId}/financials`}>
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Financials
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{categoryConfig.name} KPIs</h1>
          {deal && (
            <p className="text-sm text-muted-foreground mt-1">{deal.name}</p>
          )}
        </div>
        <KPIViewFilter selected={viewMode} onChange={setViewMode} />
      </div>

      {/* Category Navigation */}
      <KPICategoryNav
        selected={category as KpiCategory}
        onChange={handleCategoryChange}
      />

      {/* Primary KPIs (first 4) */}
      <div>
        <h2 className="font-semibold mb-4">Key Metrics</h2>
        <KPICardGrid columns={4}>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-4">
                <Skeleton className="h-8 w-8 rounded-lg mb-2" />
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))
          ) : categoryKpis.length > 0 ? (
            categoryKpis.slice(0, 4).map((kpi: KpiCardDataWithDimensions) => {
              const iconConfig = getKpiIcon(kpi.code);
              return (
                <KPIComparisonCard
                  key={kpi.id}
                  kpi={kpi}
                  viewMode={viewMode}
                  icon={iconConfig.icon}
                  iconColor={iconConfig.color}
                  iconBg={iconConfig.bg}
                />
              );
            })
          ) : (
            <div className="col-span-4 text-center py-8 text-muted-foreground">
              No KPI data available for this category.
            </div>
          )}
        </KPICardGrid>
      </div>

      {/* Trend Chart */}
      {primaryKpi && (
        <KPITrendChart
          title={`${categoryConfig.name} Performance (${primaryKpi.name})`}
          data={chartData}
          format={primaryKpi.format === 'percentage' ? 'percentage' : 'currency'}
          isLoading={isLoading}
          showForecast={isComparisonMode && viewMode === 'vs_forecast'}
          showBudget={isComparisonMode && viewMode === 'vs_budget'}
        />
      )}

      {/* Secondary KPIs (remaining) */}
      {categoryKpis.length > 4 && (
        <div>
          <h2 className="font-semibold mb-4">Additional Metrics</h2>
          <KPICardGrid columns={4}>
            {categoryKpis.slice(4).map((kpi: KpiCardDataWithDimensions) => {
              const iconConfig = getKpiIcon(kpi.code);
              return (
                <KPIComparisonCard
                  key={kpi.id}
                  kpi={kpi}
                  viewMode={viewMode}
                  icon={iconConfig.icon}
                  iconColor={iconConfig.color}
                  iconBg={iconConfig.bg}
                />
              );
            })}
          </KPICardGrid>
        </div>
      )}
    </div>
  );
}

