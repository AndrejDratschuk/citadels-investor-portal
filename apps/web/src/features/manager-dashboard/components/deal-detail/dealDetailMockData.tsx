/**
 * Mock data for DealDetail component
 * TODO: Replace with real API calls when available
 */

import {
  Building2,
  Factory,
  Store,
  Landmark,
  Home,
} from 'lucide-react';
import type { KpiCategory, DealKpiSummaryWithDimensions } from '@altsui/shared';
import type { Deal } from '@/lib/api/deals';

// ============================================
// Property Type Configuration
// ============================================
export interface PropertyTypeConfig {
  gradient: string;
  icon: React.ReactNode;
}

export const propertyTypeConfig: Record<string, PropertyTypeConfig> = {
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

export function getPropertyTypeConfig(propertyType: string): PropertyTypeConfig {
  return propertyTypeConfig[propertyType] || propertyTypeConfig.other;
}

// ============================================
// Status Styles
// ============================================
export const statusStyles: Record<string, string> = {
  prospective: 'bg-gray-100 text-gray-700',
  under_contract: 'bg-yellow-100 text-yellow-700',
  acquired: 'bg-blue-100 text-blue-700',
  renovating: 'bg-orange-100 text-orange-700',
  stabilized: 'bg-green-100 text-green-700',
  for_sale: 'bg-purple-100 text-purple-700',
  sold: 'bg-gray-100 text-gray-700',
};

// ============================================
// Types
// ============================================
export interface DealWithKpis extends Deal {
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

export interface MockInvestor {
  id: string;
  name: string;
  ownershipPercentage: number;
  investedAmount: number;
}

export interface MockDocument {
  id: string;
  name: string;
  type: string;
  createdAt: string;
}

export interface MockCategoryKpi {
  code: string;
  name: string;
  value: number;
  previousValue: number;
  format: 'currency' | 'percentage' | 'number' | 'ratio';
}

export interface ChartDataPoint {
  date: string;
  label: string;
  actual: number;
  forecast: number | null;
  budget: number | null;
}

// ============================================
// Mock Data
// ============================================
export const mockDeal: DealWithKpis = {
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

export const mockInvestors: MockInvestor[] = [
  { id: '1', name: 'John Smith', ownershipPercentage: 0.0192, investedAmount: 264960 },
  { id: '2', name: 'Sarah Johnson', ownershipPercentage: 0.0150, investedAmount: 207000 },
  { id: '3', name: 'Emily Davis', ownershipPercentage: 0.0180, investedAmount: 248400 },
  { id: '4', name: 'Robert Wilson', ownershipPercentage: 0.0120, investedAmount: 165600 },
];

export const mockDocuments: MockDocument[] = [
  { id: '1', name: 'Purchase Agreement', type: 'other', createdAt: '2023-06-01' },
  { id: '2', name: 'Property Inspection Report', type: 'other', createdAt: '2023-06-05' },
  { id: '3', name: 'Q3 2024 Report', type: 'report', createdAt: '2024-10-15' },
];

// Pure function: creates mock KPI summary (receives lastUpdated as parameter for determinism)
export function createMockKpiSummary(lastUpdated: string): DealKpiSummaryWithDimensions {
  return {
    dealId: '1',
    dealName: 'Riverside Apartments',
    featured: [
      { id: '1', code: 'noi', name: 'NOI', value: '$985K', rawValue: 985000, change: 12, changeLabel: 'vs Last Month', format: 'currency', category: 'property_performance', actualValue: 985000, forecastValue: 950000, budgetValue: 900000, previousPeriodValue: 879464, vsForecast: null, vsBudget: null, vsLastPeriod: null, isInverseMetric: false },
      { id: '2', code: 'cap_rate', name: 'Cap Rate', value: '6.93%', rawValue: 0.0693, change: 5, changeLabel: 'vs Last Month', format: 'percentage', category: 'property_performance', actualValue: 0.0693, forecastValue: 0.068, budgetValue: 0.065, previousPeriodValue: 0.066, vsForecast: null, vsBudget: null, vsLastPeriod: null, isInverseMetric: false },
      { id: '3', code: 'physical_occupancy', name: 'Occupancy', value: '94%', rawValue: 0.94, change: -2, changeLabel: 'vs Last Month', format: 'percentage', category: 'occupancy', actualValue: 0.94, forecastValue: 0.95, budgetValue: 0.92, previousPeriodValue: 0.96, vsForecast: null, vsBudget: null, vsLastPeriod: null, isInverseMetric: false },
      { id: '4', code: 'dscr', name: 'DSCR', value: '1.45x', rawValue: 1.45, change: 8, changeLabel: 'vs Last Month', format: 'ratio', category: 'debt_service', actualValue: 1.45, forecastValue: 1.40, budgetValue: 1.35, previousPeriodValue: 1.34, vsForecast: null, vsBudget: null, vsLastPeriod: null, isInverseMetric: false },
      { id: '5', code: 'gpr', name: 'GPR', value: '$125K', rawValue: 125000, change: 10, changeLabel: 'vs Last Month', format: 'currency', category: 'rent_revenue', actualValue: 125000, forecastValue: 120000, budgetValue: 115000, previousPeriodValue: 113636, vsForecast: null, vsBudget: null, vsLastPeriod: null, isInverseMetric: false },
      { id: '6', code: 'egi', name: 'EGI', value: '$118K', rawValue: 118000, change: 9, changeLabel: 'vs Last Month', format: 'currency', category: 'rent_revenue', actualValue: 118000, forecastValue: 115000, budgetValue: 110000, previousPeriodValue: 109259, vsForecast: null, vsBudget: null, vsLastPeriod: null, isInverseMetric: false },
    ],
    byCategory: {
      rent_revenue: [],
      occupancy: [],
      property_performance: [],
      financial: [],
      debt_service: [],
    },
    lastUpdated,
  };
}

export const MOCK_CATEGORY_DATA: Record<KpiCategory, MockCategoryKpi[]> = {
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

export const MOCK_CHART_DATA: ChartDataPoint[] = [
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
// Helper Functions
// ============================================
import { formatCurrency, formatPercentage } from '@altsui/shared';

export function formatKpiValue(value: number | null, format: string): string {
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

// Pure function: generates chart data based on primary KPI value
export function generateChartDataFromKpi(primaryValue: number): ChartDataPoint[] {
  return [
    { date: '2024-01', label: 'Jan', actual: primaryValue * 0.92, forecast: null, budget: null },
    { date: '2024-02', label: 'Feb', actual: primaryValue * 0.94, forecast: null, budget: null },
    { date: '2024-03', label: 'Mar', actual: primaryValue * 0.95, forecast: null, budget: null },
    { date: '2024-04', label: 'Apr', actual: primaryValue * 0.96, forecast: null, budget: null },
    { date: '2024-05', label: 'May', actual: primaryValue * 0.97, forecast: null, budget: null },
    { date: '2024-06', label: 'Jun', actual: primaryValue * 0.96, forecast: null, budget: null },
    { date: '2024-07', label: 'Jul', actual: primaryValue * 0.98, forecast: null, budget: null },
    { date: '2024-08', label: 'Aug', actual: primaryValue * 0.99, forecast: null, budget: null },
    { date: '2024-09', label: 'Sep', actual: primaryValue * 0.995, forecast: null, budget: null },
    { date: '2024-10', label: 'Oct', actual: primaryValue, forecast: null, budget: null },
  ];
}
