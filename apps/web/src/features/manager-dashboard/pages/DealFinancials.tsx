/**
 * Deal Financials Page (Level 2)
 * Displays featured KPIs, trend chart, category navigation, and embedded outliers view
 */

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  DollarSign,
  Home,
  TrendingUp,
  TrendingDown,
  BarChart3,
  CreditCard,
  Percent,
  Building2,
  Wallet,
  PiggyBank,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { outliersApi } from '@/lib/api/kpis';
import { dealsApi } from '@/lib/api/deals';
import { useDealKpiSummaryWithDimensions } from '../hooks/useDealKpis';
import {
  KPICardGrid,
  KPICategoryNav,
  KPITrendChart,
  KPIViewFilter,
  KPIComparisonCard,
  OutlierCard,
} from '../components/kpi';
import type { KpiCategoryNavOption } from '../components/kpi';
import type { KpiCardDataWithDimensions, KpiViewMode } from '@altsui/shared';

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
// Chart Data Builder
// ============================================
function buildChartData(
  featured: KpiCardDataWithDimensions[]
): Array<{ date: string; label: string; actual: number | null; forecast: number | null; budget: number | null }> {
  // Find NOI or first featured KPI for chart display
  const primaryKpi = featured.find(k => k.code === 'noi') || featured[0];
  
  if (!primaryKpi) {
    return [];
  }

  // Generate sample chart data based on current value
  // In production, this would come from the time series API
  const baseValue = primaryKpi.actualValue || 100000;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  return months.slice(0, currentMonth + 1).map((label, i) => ({
    date: `2024-${String(i + 1).padStart(2, '0')}`,
    label,
    actual: Math.round(baseValue * (0.92 + (i * 0.008))),
    forecast: primaryKpi.forecastValue ? Math.round(primaryKpi.forecastValue * (0.95 + (i * 0.005))) : null,
    budget: primaryKpi.budgetValue ? Math.round(primaryKpi.budgetValue * (0.94 + (i * 0.006))) : null,
  }));
}

// ============================================
// Component
// ============================================
export function DealFinancials(): JSX.Element {
  const { id: dealId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<KpiCategoryNavOption>('all');
  const [viewMode, setViewMode] = useState<KpiViewMode>('actual');

  // Fetch deal info
  const { data: deal, isLoading: isDealLoading } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: () => dealsApi.getById(dealId!),
    enabled: !!dealId,
  });

  // Fetch KPI summary with dimensions (actual/forecast/budget + variances)
  const { data: summary, isLoading: isSummaryLoading } = useDealKpiSummaryWithDimensions(
    dealId,
    { dealName: deal?.name }
  );

  // Fetch outliers (only when outliers category is selected)
  const { data: outliers, isLoading: isOutliersLoading } = useQuery({
    queryKey: ['deal-outliers', dealId],
    queryFn: () => outliersApi.getOutliers(dealId!, { topCount: 5 }),
    enabled: !!dealId && selectedCategory === 'outliers',
  });

  const isLoading = isDealLoading || isSummaryLoading;
  const isComparisonMode = viewMode.startsWith('vs_');

  // Build chart data from featured KPIs
  const chartData = summary?.featured ? buildChartData(summary.featured) : [];

  // Outliers state
  const hasTopPerformers = (outliers?.topPerformers?.length ?? 0) > 0;
  const hasBottomPerformers = (outliers?.bottomPerformers?.length ?? 0) > 0;
  const hasAnyOutliers = hasTopPerformers || hasBottomPerformers;

  // Handle category change - outliers shown inline, others navigate
  const handleCategoryChange = (category: KpiCategoryNavOption): void => {
    if (category === 'all' || category === 'outliers') {
      setSelectedCategory(category);
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
        <div className="flex items-center gap-4">
          <KPIViewFilter selected={viewMode} onChange={setViewMode} />
          <span className="text-xs text-muted-foreground">
            Last updated: {summary?.lastUpdated 
              ? new Date(summary.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '—'}
          </span>
        </div>
      </div>

      {/* Category Navigation - Always visible */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="font-semibold mb-4">Browse by Category</h2>
        <KPICategoryNav
          selected={selectedCategory}
          onChange={handleCategoryChange}
        />
      </div>

      {/* Content based on selected category */}
      {selectedCategory === 'outliers' ? (
        /* Outliers View */
        <>
          {/* Outliers Loading State */}
          {isOutliersLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[0, 1].map((section) => (
                <div key={section} className="rounded-xl border bg-card p-5 shadow-sm">
                  <Skeleton className="h-6 w-40 mb-4" />
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Outliers Empty State */}
          {!isOutliersLoading && !hasAnyOutliers && (
            <div className="rounded-xl border bg-card p-10 shadow-sm text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">No Outliers Detected</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                All metrics are performing within expected ranges. This is good news!
                Continue monitoring for any future variances.
              </p>
            </div>
          )}

          {/* Outliers Dumbbell Layout */}
          {!isOutliersLoading && hasAnyOutliers && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performers Section */}
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 bg-emerald-50 border-b border-emerald-100">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  <h2 className="font-semibold text-emerald-800">Top Performers</h2>
                  <span className="ml-auto text-sm text-emerald-600 font-medium">
                    Exceeding Targets
                  </span>
                </div>
                <div className="p-4 space-y-4">
                  {hasTopPerformers ? (
                    outliers!.topPerformers.map((outlier, index) => (
                      <OutlierCard
                        key={outlier.kpiId}
                        outlier={outlier}
                        dealId={dealId!}
                        rank={index + 1}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No top performers detected</p>
                      <p className="text-xs mt-1">
                        No KPIs are exceeding their targets by the configured threshold
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Performers Section */}
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 bg-red-50 border-b border-red-100">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <h2 className="font-semibold text-red-800">Bottom Performers</h2>
                  <span className="ml-auto text-sm text-red-600 font-medium">
                    Missing Targets
                  </span>
                </div>
                <div className="p-4 space-y-4">
                  {hasBottomPerformers ? (
                    outliers!.bottomPerformers.map((outlier, index) => (
                      <OutlierCard
                        key={outlier.kpiId}
                        outlier={outlier}
                        dealId={dealId!}
                        rank={index + 1}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No bottom performers detected</p>
                      <p className="text-xs mt-1">
                        No KPIs are missing their targets by the configured threshold
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Outliers Info Section */}
          {!isOutliersLoading && hasAnyOutliers && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                <strong>About Outliers:</strong> KPIs shown here have a variance of 20% or more 
                from their baseline (forecast, budget, or prior period). Configure thresholds and 
                baselines in{' '}
                <Link
                  to="/manager/settings/kpis"
                  className="text-primary hover:underline font-medium"
                >
                  KPI Settings
                </Link>
                .
              </p>
            </div>
          )}
        </>
      ) : (
        /* Default KPIs View (All KPIs) */
        <>
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
            ) : summary?.featured ? (
              summary.featured.map((kpi: KpiCardDataWithDimensions) => {
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
              <div className="col-span-6 text-center py-8 text-muted-foreground">
                No KPI data available. Upload data to see metrics.
              </div>
            )}
          </KPICardGrid>

          {/* Row 2: Trend Chart */}
          <KPITrendChart
            title="Monthly NOI Performance"
            data={chartData}
            isLoading={isLoading}
            format="currency"
            showForecast={isComparisonMode && viewMode === 'vs_forecast'}
            showBudget={isComparisonMode && viewMode === 'vs_budget'}
          />

          {/* Row 3: Financial Statements Link */}
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
        </>
      )}
    </div>
  );
}

