/**
 * Shared KPI constants used across the application
 */

import {
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
  Briefcase,
  Calendar,
  Hash,
} from 'lucide-react';
import type { KpiCategory } from '@altsui/shared';

// ============================================
// KPI Icon Mapping
// ============================================
export interface KpiIconConfig {
  icon: typeof DollarSign;
  color: string;
  bg: string;
}

export const KPI_ICONS: Record<string, KpiIconConfig> = {
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
  total_debt_outstanding: { icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-100' },

  // Fund Overview
  fund_vintage: { icon: Calendar, color: 'text-slate-600', bg: 'bg-slate-100' },
  committed_capital: { icon: DollarSign, color: 'text-slate-600', bg: 'bg-slate-100' },
  capital_called: { icon: DollarSign, color: 'text-slate-600', bg: 'bg-slate-100' },
  remaining_commitment: { icon: DollarSign, color: 'text-slate-600', bg: 'bg-slate-100' },
  total_properties: { icon: Building2, color: 'text-slate-600', bg: 'bg-slate-100' },
  gross_asset_value: { icon: DollarSign, color: 'text-slate-600', bg: 'bg-slate-100' },
  net_asset_value: { icon: DollarSign, color: 'text-slate-600', bg: 'bg-slate-100' },
  gross_irr: { icon: TrendingUp, color: 'text-slate-600', bg: 'bg-slate-100' },
  net_irr: { icon: TrendingUp, color: 'text-slate-600', bg: 'bg-slate-100' },
  gross_equity_multiple: { icon: TrendingUp, color: 'text-slate-600', bg: 'bg-slate-100' },
  net_equity_multiple: { icon: TrendingUp, color: 'text-slate-600', bg: 'bg-slate-100' },
  dpi: { icon: Percent, color: 'text-slate-600', bg: 'bg-slate-100' },
  rvpi: { icon: Percent, color: 'text-slate-600', bg: 'bg-slate-100' },
  tvpi: { icon: Percent, color: 'text-slate-600', bg: 'bg-slate-100' },

  // Additional Property/Deal KPIs
  acquisition_price: { icon: DollarSign, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  acquisition_date: { icon: Calendar, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  cap_rate_at_acquisition: { icon: Percent, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  noi_yield_on_cost: { icon: Percent, color: 'text-purple-600', bg: 'bg-purple-100' },
  current_gav: { icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  total_equity_invested: { icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  gross_square_footage: { icon: Hash, color: 'text-slate-600', bg: 'bg-slate-100' },
  total_units: { icon: Building2, color: 'text-slate-600', bg: 'bg-slate-100' },
  total_beds: { icon: Building2, color: 'text-slate-600', bg: 'bg-slate-100' },
  in_place_noi: { icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
  annualized_noi: { icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
  occupancy_rate: { icon: Home, color: 'text-blue-600', bg: 'bg-blue-100' },
};

export const DEFAULT_KPI_ICON: KpiIconConfig = {
  icon: BarChart3,
  color: 'text-slate-600',
  bg: 'bg-slate-100',
};

export function getKpiIcon(code: string): KpiIconConfig {
  return KPI_ICONS[code] || DEFAULT_KPI_ICON;
}

// ============================================
// KPI Category Configuration
// ============================================
export interface KpiCategoryConfig {
  name: string;
  icon: typeof DollarSign;
  color: string;
}

export const KPI_CATEGORY_CONFIG: Record<KpiCategory, KpiCategoryConfig> = {
  rent_revenue: { name: 'Rent/Revenue', icon: DollarSign, color: 'text-emerald-600' },
  occupancy: { name: 'Occupancy', icon: Home, color: 'text-blue-600' },
  property_performance: { name: 'Performance', icon: TrendingUp, color: 'text-purple-600' },
  financial: { name: 'Financial', icon: BarChart3, color: 'text-indigo-600' },
  debt_service: { name: 'Debt Service', icon: CreditCard, color: 'text-orange-600' },
  fund_overview: { name: 'Fund Overview', icon: Briefcase, color: 'text-slate-600' },
};
