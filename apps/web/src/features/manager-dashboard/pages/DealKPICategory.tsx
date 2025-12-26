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
import { dealKpisApi, kpiDefinitionsApi } from '@/lib/api/kpis';
import { dealsApi } from '@/lib/api/deals';
import {
  KPICard,
  KPICardGrid,
  KPICategoryNav,
  KPITrendChart,
  KPITimeFilter,
  getCategoryConfig,
} from '../components/kpi';
import { cn } from '@/lib/utils';
import type { KpiCategory, KpiDataType, KpiDefinition, KpiDataPoint } from '@flowveda/shared';
import { formatCurrency, formatPercentage, calculateChangePercent } from '@flowveda/shared';

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
// Format Value Helper
// ============================================
function formatKpiValue(value: number | null, format: string): string {
  if (value === null) return '—';

  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value);
    case 'ratio':
      return `${value.toFixed(2)}x`;
    case 'number':
    default:
      return value.toLocaleString();
  }
}

// ============================================
// Mock Data for Demo
// ============================================
const MOCK_CATEGORY_DATA: Record<KpiCategory, Array<{
  code: string;
  name: string;
  value: number;
  previousValue: number;
  format: 'currency' | 'percentage' | 'number' | 'ratio';
}>> = {
  rent_revenue: [
    { code: 'gpr', name: 'Gross Potential Rent', value: 125000, previousValue: 113636, format: 'currency' },
    { code: 'egi', name: 'Effective Gross Income', value: 118000, previousValue: 109259, format: 'currency' },
    { code: 'total_revenue', name: 'Total Revenue', value: 142000, previousValue: 126785, format: 'currency' },
    { code: 'revenue_per_unit', name: 'Revenue Per Unit', value: 1183, previousValue: 1126, format: 'currency' },
    { code: 'revenue_per_sqft', name: 'Revenue Per Sq Ft', value: 1.25, previousValue: 1.19, format: 'currency' },
    { code: 'rent_growth', name: 'Rent Growth', value: 0.032, previousValue: 0.028, format: 'percentage' },
    { code: 'loss_to_lease', name: 'Loss to Lease', value: 4200, previousValue: 4800, format: 'currency' },
    { code: 'concessions', name: 'Concessions', value: 2100, previousValue: 2500, format: 'currency' },
  ],
  occupancy: [
    { code: 'physical_occupancy', name: 'Physical Occupancy Rate', value: 0.94, previousValue: 0.96, format: 'percentage' },
    { code: 'economic_occupancy', name: 'Economic Occupancy Rate', value: 0.92, previousValue: 0.93, format: 'percentage' },
    { code: 'vacancy_rate', name: 'Vacancy Rate', value: 0.06, previousValue: 0.04, format: 'percentage' },
    { code: 'lease_renewal_rate', name: 'Lease Renewal Rate', value: 0.72, previousValue: 0.68, format: 'percentage' },
    { code: 'avg_days_vacant', name: 'Average Days Vacant', value: 18, previousValue: 21, format: 'number' },
    { code: 'move_ins', name: 'Move-Ins', value: 8, previousValue: 6, format: 'number' },
    { code: 'move_outs', name: 'Move-Outs', value: 5, previousValue: 7, format: 'number' },
  ],
  property_performance: [
    { code: 'noi', name: 'Net Operating Income', value: 985000, previousValue: 879464, format: 'currency' },
    { code: 'noi_margin', name: 'NOI Margin', value: 0.693, previousValue: 0.68, format: 'percentage' },
    { code: 'operating_expense_ratio', name: 'Operating Expense Ratio', value: 0.307, previousValue: 0.32, format: 'percentage' },
    { code: 'cap_rate', name: 'Cap Rate', value: 0.0693, previousValue: 0.066, format: 'percentage' },
    { code: 'cash_on_cash', name: 'Cash on Cash Return', value: 0.092, previousValue: 0.085, format: 'percentage' },
    { code: 'total_expenses', name: 'Total Operating Expenses', value: 437000, previousValue: 421153, format: 'currency' },
    { code: 'expense_per_unit', name: 'Expense Per Unit', value: 3641, previousValue: 3509, format: 'currency' },
  ],
  financial: [
    { code: 'ebitda', name: 'EBITDA', value: 1050000, previousValue: 970588, format: 'currency' },
    { code: 'free_cash_flow', name: 'Free Cash Flow', value: 620000, previousValue: 564545, format: 'currency' },
    { code: 'roi', name: 'Return on Investment', value: 0.145, previousValue: 0.132, format: 'percentage' },
    { code: 'irr', name: 'Internal Rate of Return', value: 0.182, previousValue: 0.168, format: 'percentage' },
    { code: 'equity_multiple', name: 'Equity Multiple', value: 1.45, previousValue: 1.38, format: 'ratio' },
    { code: 'property_value', name: 'Current Property Value', value: 14200000, previousValue: 13333333, format: 'currency' },
    { code: 'appreciation', name: 'Appreciation', value: 0.065, previousValue: 0.052, format: 'percentage' },
  ],
  debt_service: [
    { code: 'dscr', name: 'Debt Service Coverage Ratio', value: 1.45, previousValue: 1.34, format: 'ratio' },
    { code: 'ltv', name: 'Loan-to-Value', value: 0.62, previousValue: 0.65, format: 'percentage' },
    { code: 'interest_coverage', name: 'Interest Coverage Ratio', value: 2.1, previousValue: 1.95, format: 'ratio' },
    { code: 'principal_balance', name: 'Principal Balance', value: 8804000, previousValue: 8900000, format: 'currency' },
    { code: 'monthly_debt_service', name: 'Monthly Debt Service', value: 56000, previousValue: 56000, format: 'currency' },
    { code: 'annual_debt_service', name: 'Annual Debt Service', value: 672000, previousValue: 672000, format: 'currency' },
    { code: 'interest_rate', name: 'Interest Rate', value: 0.0575, previousValue: 0.0575, format: 'percentage' },
  ],
};

// ============================================
// Component
// ============================================
export function DealKPICategory(): JSX.Element {
  const { id: dealId, category } = useParams<{ id: string; category: string }>();
  const navigate = useNavigate();
  const [dataType, setDataType] = useState<KpiDataType>('actual');
  const [showComparison, setShowComparison] = useState(false);

  const categoryConfig = getCategoryConfig(category as KpiCategory);

  // Fetch deal info
  const { data: deal, isLoading: isDealLoading } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: () => dealsApi.getById(dealId!),
    enabled: !!dealId,
  });

  // Fetch KPI definitions for this category
  const { data: definitions, isLoading: isDefsLoading } = useQuery({
    queryKey: ['kpi-definitions', category],
    queryFn: () => kpiDefinitionsApi.getByCategory(category as KpiCategory),
    enabled: !!category,
  });

  // Fetch KPI data for this category
  const { data: kpiData, isLoading: isDataLoading } = useQuery({
    queryKey: ['deal-kpis', dealId, category, dataType],
    queryFn: () => dealKpisApi.getByCategory(dealId!, category as KpiCategory, { dataType }),
    enabled: !!dealId && !!category,
  });

  const isLoading = isDealLoading || isDefsLoading || isDataLoading;

  // Get mock data for this category
  const mockData = MOCK_CATEGORY_DATA[category as KpiCategory] || [];

  // Build KPI cards from mock data
  const kpiCards = mockData.map((item) => {
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

  // Handle category navigation
  const handleCategoryChange = (newCategory: KpiCategory | 'all') => {
    if (newCategory === 'all') {
      navigate(`/manager/deals/${dealId}/financials`);
    } else {
      navigate(`/manager/deals/${dealId}/financials/category/${newCategory}`);
    }
  };

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
        <div className="flex items-center gap-3">
          <KPITimeFilter selected={dataType} onChange={setDataType} />
          <Button
            variant={showComparison ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowComparison(!showComparison)}
          >
            Compare
          </Button>
        </div>
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
          ) : (
            kpiCards.slice(0, 4).map((kpi) => (
              <KPICard
                key={kpi.code}
                title={kpi.name}
                value={kpi.value}
                icon={kpi.icon}
                iconColor={kpi.iconColor}
                iconBg={kpi.iconBg}
                change={kpi.change}
                changeLabel={showComparison ? 'vs Budget' : 'vs Last Period'}
              />
            ))
          )}
        </KPICardGrid>
      </div>

      {/* Trend Chart */}
      <KPITrendChart
        title={`${categoryConfig.name} Performance (${mockData[0]?.name || 'Primary KPI'})`}
        data={[
          { date: '2024-01', label: 'Jan', actual: mockData[0]?.value ? mockData[0].value * 0.92 : 100, forecast: null },
          { date: '2024-02', label: 'Feb', actual: mockData[0]?.value ? mockData[0].value * 0.94 : 102, forecast: null },
          { date: '2024-03', label: 'Mar', actual: mockData[0]?.value ? mockData[0].value * 0.95 : 104, forecast: null },
          { date: '2024-04', label: 'Apr', actual: mockData[0]?.value ? mockData[0].value * 0.96 : 103, forecast: null },
          { date: '2024-05', label: 'May', actual: mockData[0]?.value ? mockData[0].value * 0.97 : 105, forecast: null },
          { date: '2024-06', label: 'Jun', actual: mockData[0]?.value ? mockData[0].value * 0.96 : 104, forecast: null },
          { date: '2024-07', label: 'Jul', actual: mockData[0]?.value ? mockData[0].value * 0.98 : 107, forecast: null },
          { date: '2024-08', label: 'Aug', actual: mockData[0]?.value ? mockData[0].value * 0.99 : 109, forecast: null },
          { date: '2024-09', label: 'Sep', actual: mockData[0]?.value ? mockData[0].value * 0.995 : 110, forecast: null },
          { date: '2024-10', label: 'Oct', actual: mockData[0]?.value || 112, forecast: null },
        ]}
        format={mockData[0]?.format === 'percentage' ? 'percentage' : 'currency'}
        isLoading={isLoading}
      />

      {/* Secondary KPIs (remaining) */}
      {kpiCards.length > 4 && (
        <div>
          <h2 className="font-semibold mb-4">Additional Metrics</h2>
          <KPICardGrid columns={4}>
            {kpiCards.slice(4).map((kpi) => (
              <KPICard
                key={kpi.code}
                title={kpi.name}
                value={kpi.value}
                icon={kpi.icon}
                iconColor={kpi.iconColor}
                iconBg={kpi.iconBg}
                change={kpi.change}
                changeLabel={showComparison ? 'vs Budget' : 'vs Last Period'}
              />
            ))}
          </KPICardGrid>
        </div>
      )}
    </div>
  );
}

