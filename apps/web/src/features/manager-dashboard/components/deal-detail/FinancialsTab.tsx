import { Link } from 'react-router-dom';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { calculateChangePercent } from '@altsui/shared';
import type {
  KpiCardDataWithDimensions,
  DealKpiSummaryWithDimensions,
  KpiDataType,
  OutliersResponse,
} from '@altsui/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getKpiIcon } from '@/lib/kpiConstants';
import {
  KPICard,
  KPICardGrid,
  KPICategoryNav,
  KPITrendChart,
  KPITimeFilter,
  TimePeriodFilter,
  OutlierCard,
  getCategoryConfig,
} from '../kpi';
import type { KpiCategoryNavOption, TimePeriodPreset, DateRange } from '../kpi';
import {
  MOCK_CATEGORY_DATA,
  MOCK_CHART_DATA,
  formatKpiValue,
  generateChartDataFromKpi,
  type ChartDataPoint,
  type MockCategoryKpi,
} from './dealDetailMockData';

interface CategoryKpi {
  code: string;
  name: string;
  value: string;
  rawValue: number | null;
  change: number | null;
  icon: typeof TrendingUp;
  iconColor: string;
  iconBg: string;
  format: string;
}

interface FinancialsTabProps {
  dealId: string;
  kpiSummary: DealKpiSummaryWithDimensions | undefined;
  outliers: OutliersResponse | undefined;
  isKpiLoading: boolean;
  isOutliersLoading: boolean;
  hasRealKpiData: boolean;
  selectedCategory: KpiCategoryNavOption;
  dataType: KpiDataType;
  timePeriod: TimePeriodPreset;
  dateRange: DateRange;
  onCategoryChange: (category: KpiCategoryNavOption) => void;
  onDataTypeChange: (dataType: KpiDataType) => void;
  onTimePeriodChange: (preset: TimePeriodPreset, range: DateRange) => void;
  displayKpiSummary: DealKpiSummaryWithDimensions;
}

// ============================================
// Helper Functions
// ============================================
function getDisplayValue(kpi: KpiCardDataWithDimensions, dataType: KpiDataType): string {
  let rawValue: number | null;
  switch (dataType) {
    case 'forecast':
      rawValue = kpi.forecastValue;
      break;
    case 'budget':
      rawValue = kpi.budgetValue;
      break;
    default:
      rawValue = kpi.actualValue;
  }
  if (rawValue === null) return '—';

  switch (kpi.format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(rawValue);
    case 'percentage': {
      const pctValue = rawValue * 100;
      // Show 1 decimal only if needed, otherwise show whole number
      const formatted = pctValue % 1 === 0 ? pctValue.toFixed(0) : pctValue.toFixed(1);
      return `${formatted}%`;
    }
    case 'ratio': {
      // Show 2 decimals only if needed
      const formatted = rawValue % 1 === 0 ? rawValue.toFixed(0) : rawValue.toFixed(2);
      return `${formatted}x`;
    }
    default:
      return rawValue.toLocaleString();
  }
}

function buildCategoryKpis(
  selectedCategory: KpiCategoryNavOption,
  kpiSummary: DealKpiSummaryWithDimensions | undefined,
  hasRealKpiData: boolean,
  dataType: KpiDataType
): CategoryKpi[] {
  if (selectedCategory === 'all' || selectedCategory === 'outliers') {
    return [];
  }

  if (hasRealKpiData && kpiSummary?.byCategory[selectedCategory]?.length) {
    return kpiSummary.byCategory[selectedCategory].map((kpi) => {
      const iconConfig = getKpiIcon(kpi.code);
      let rawValue: number | null;
      switch (dataType) {
        case 'forecast':
          rawValue = kpi.forecastValue;
          break;
        case 'budget':
          rawValue = kpi.budgetValue;
          break;
        default:
          rawValue = kpi.actualValue;
      }
      return {
        code: kpi.code,
        name: kpi.name,
        value: getDisplayValue(kpi, dataType),
        rawValue: rawValue,
        change: dataType === 'actual' ? kpi.change : null,
        icon: iconConfig.icon,
        iconColor: iconConfig.color,
        iconBg: iconConfig.bg,
        format: kpi.format,
      };
    });
  }

  const mockData = MOCK_CATEGORY_DATA[selectedCategory];
  if (!mockData) return [];

  return mockData.map((item: MockCategoryKpi) => {
    const iconConfig = getKpiIcon(item.code);
    const change = calculateChangePercent(item.value, item.previousValue);
    return {
      code: item.code,
      name: item.name,
      value: formatKpiValue(item.value, item.format),
      rawValue: item.value,
      change,
      icon: iconConfig.icon,
      iconColor: iconConfig.color,
      iconBg: iconConfig.bg,
      format: item.format,
    };
  });
}

function getChartData(selectedCategory: KpiCategoryNavOption): ChartDataPoint[] {
  if (selectedCategory === 'all' || selectedCategory === 'outliers') {
    return MOCK_CHART_DATA;
  }
  const categoryData = MOCK_CATEGORY_DATA[selectedCategory];
  if (!categoryData || categoryData.length === 0) {
    return MOCK_CHART_DATA;
  }
  return generateChartDataFromKpi(categoryData[0].value);
}

function getChartInfo(selectedCategory: KpiCategoryNavOption): { title: string; format: 'currency' | 'percentage' } {
  if (selectedCategory === 'all' || selectedCategory === 'outliers') {
    return { title: 'Monthly NOI Performance', format: 'currency' };
  }
  const categoryData = MOCK_CATEGORY_DATA[selectedCategory];
  if (!categoryData || categoryData.length === 0) {
    return { title: 'Monthly Performance', format: 'currency' };
  }
  const primaryKpi = categoryData[0];
  return {
    title: `${primaryKpi.name} Trend`,
    format: primaryKpi.format === 'percentage' ? 'percentage' : 'currency',
  };
}

// ============================================
// Component
// ============================================
export function FinancialsTab({
  dealId,
  kpiSummary,
  outliers,
  isKpiLoading,
  isOutliersLoading,
  hasRealKpiData,
  selectedCategory,
  dataType,
  timePeriod,
  dateRange,
  onCategoryChange,
  onDataTypeChange,
  onTimePeriodChange,
  displayKpiSummary,
}: FinancialsTabProps): JSX.Element {
  const hasTopPerformers = (outliers?.topPerformers?.length ?? 0) > 0;
  const hasBottomPerformers = (outliers?.bottomPerformers?.length ?? 0) > 0;
  const hasAnyOutliers = hasTopPerformers || hasBottomPerformers;

  const categoryKpis = buildCategoryKpis(selectedCategory, kpiSummary, hasRealKpiData, dataType);
  const chartData = getChartData(selectedCategory);
  const chartInfo = getChartInfo(selectedCategory);

  return (
    <div className="space-y-6">
      {/* Data Source Indicator - Only show for mock data */}
      {!isKpiLoading && !hasRealKpiData && (
        <MockDataIndicator />
      )}

      {/* Time Period Filter */}
      <div className="flex items-center justify-between">
        <TimePeriodFilter
          selected={timePeriod}
          customRange={timePeriod === 'custom' ? dateRange : undefined}
          onChange={onTimePeriodChange}
        />
      </div>

      {/* Header with Data Type Filter (for all views except outliers) */}
      {selectedCategory !== 'outliers' && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {selectedCategory === 'all' ? 'All KPIs' : `${getCategoryConfig(selectedCategory).name} KPIs`}
          </h2>
          <KPITimeFilter selected={dataType} onChange={onDataTypeChange} />
        </div>
      )}

      {/* Category Navigation */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="font-semibold mb-4">Browse by Category</h2>
        <KPICategoryNav selected={selectedCategory} onChange={onCategoryChange} />
      </div>

      {/* Content based on selected category */}
      {selectedCategory === 'outliers' ? (
        <OutliersView
          dealId={dealId}
          outliers={outliers}
          isLoading={isOutliersLoading}
          hasTopPerformers={hasTopPerformers}
          hasBottomPerformers={hasBottomPerformers}
          hasAnyOutliers={hasAnyOutliers}
        />
      ) : selectedCategory === 'all' ? (
        <AllKpisView
          displayKpiSummary={displayKpiSummary}
          isLoading={isKpiLoading}
          dataType={dataType}
          chartData={chartData}
          chartInfo={chartInfo}
        />
      ) : (
        <CategoryView
          categoryKpis={categoryKpis}
          isLoading={isKpiLoading}
          dataType={dataType}
          chartData={chartData}
          chartInfo={chartInfo}
        />
      )}

      {/* Financial Statements Link */}
      <FinancialStatementsLink dealId={dealId} />
    </div>
  );
}

// ============================================
// Sub-components
// ============================================
function MockDataIndicator(): JSX.Element {
  return (
    <div className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400">
      <AlertCircle className="h-4 w-4" />
      <span>Showing sample data - Import your data to see real metrics</span>
      <Link to="/manager/data" className="ml-auto font-medium underline hover:no-underline">
        Import Data →
      </Link>
    </div>
  );
}

interface OutliersViewProps {
  dealId: string;
  outliers: OutliersResponse | undefined;
  isLoading: boolean;
  hasTopPerformers: boolean;
  hasBottomPerformers: boolean;
  hasAnyOutliers: boolean;
}

function OutliersView({
  dealId,
  outliers,
  isLoading,
  hasTopPerformers,
  hasBottomPerformers,
  hasAnyOutliers,
}: OutliersViewProps): JSX.Element {
  if (isLoading) {
    return (
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
    );
  }

  if (!hasAnyOutliers) {
    return (
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
    );
  }

  return (
    <>
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
                  dealId={dealId}
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
                  dealId={dealId}
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

      {/* Outliers Info Section */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          <strong>About Outliers:</strong> KPIs shown here have a variance of 20% or more
          from their baseline (forecast, budget, or prior period). Configure thresholds and
          baselines in{' '}
          <Link to="/manager/settings/kpis" className="text-primary hover:underline font-medium">
            KPI Settings
          </Link>
          .
        </p>
      </div>
    </>
  );
}

interface AllKpisViewProps {
  displayKpiSummary: DealKpiSummaryWithDimensions;
  isLoading: boolean;
  dataType: KpiDataType;
  chartData: ChartDataPoint[];
  chartInfo: { title: string; format: 'currency' | 'percentage' };
}

function AllKpisView({
  displayKpiSummary,
  isLoading,
  dataType,
  chartData,
  chartInfo,
}: AllKpisViewProps): JSX.Element {
  return (
    <>
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
          displayKpiSummary.featured.map((kpi: KpiCardDataWithDimensions) => {
            const iconConfig = getKpiIcon(kpi.code);
            return (
              <KPICard
                key={kpi.id}
                title={kpi.name}
                value={getDisplayValue(kpi, dataType)}
                icon={iconConfig.icon}
                iconColor={iconConfig.color}
                iconBg={iconConfig.bg}
                change={dataType === 'actual' ? kpi.change : null}
                changeLabel={dataType === 'actual' ? kpi.changeLabel : ''}
              />
            );
          })
        )}
      </KPICardGrid>

      <KPITrendChart
        title={chartInfo.title}
        data={chartData}
        isLoading={isLoading}
        format={chartInfo.format}
      />
    </>
  );
}

interface CategoryViewProps {
  categoryKpis: CategoryKpi[];
  isLoading: boolean;
  dataType: KpiDataType;
  chartData: ChartDataPoint[];
  chartInfo: { title: string; format: 'currency' | 'percentage' };
}

function CategoryView({
  categoryKpis,
  isLoading,
  dataType,
  chartData,
  chartInfo,
}: CategoryViewProps): JSX.Element {
  return (
    <>
      {/* Key Metrics (first 4 KPIs) */}
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
          ) : (
            categoryKpis.slice(0, 4).map((kpi) => (
              <KPICard
                key={kpi.code}
                title={kpi.name}
                value={kpi.value}
                icon={kpi.icon}
                iconColor={kpi.iconColor}
                iconBg={kpi.iconBg}
                change={kpi.change}
                changeLabel={dataType === 'actual' ? 'vs Last Period' : ''}
              />
            ))
          )}
        </KPICardGrid>
      </div>

      <KPITrendChart
        title={chartInfo.title}
        data={chartData}
        isLoading={isLoading}
        format={chartInfo.format}
      />

      {/* Additional Metrics (remaining KPIs) */}
      {categoryKpis.length > 4 && (
        <div>
          <h2 className="font-semibold mb-4">Additional Metrics</h2>
          <KPICardGrid columns={4}>
            {categoryKpis.slice(4).map((kpi) => (
              <KPICard
                key={kpi.code}
                title={kpi.name}
                value={kpi.value}
                icon={kpi.icon}
                iconColor={kpi.iconColor}
                iconBg={kpi.iconBg}
                change={kpi.change}
                changeLabel={dataType === 'actual' ? 'vs Last Period' : ''}
              />
            ))}
          </KPICardGrid>
        </div>
      )}
    </>
  );
}

interface FinancialStatementsLinkProps {
  dealId: string;
}

function FinancialStatementsLink({ dealId }: FinancialStatementsLinkProps): JSX.Element {
  return (
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
  );
}
