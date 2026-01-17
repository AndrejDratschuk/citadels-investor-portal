/**
 * KPI System Types
 * Types for KPI definitions, preferences, data, and financial statements
 */

// ============================================
// KPI Category
// ============================================
export type KpiCategory = 
  | 'rent_revenue'
  | 'occupancy'
  | 'property_performance'
  | 'financial'
  | 'debt_service';

export type KpiFormat = 'currency' | 'percentage' | 'number' | 'ratio';

export type KpiPeriodType = 'monthly' | 'quarterly' | 'yearly';

export type KpiDataType = 'actual' | 'forecast' | 'budget';

export type KpiSource = 'manual' | 'google_sheets' | 'excel';

// ============================================
// KPI Definition (from kpi_definitions table)
// ============================================
export interface KpiDefinition {
  id: string;
  code: string;
  name: string;
  category: KpiCategory;
  description: string | null;
  format: KpiFormat;
  formula: string | null;
  sortOrder: number;
  createdAt: string;
}

// ============================================
// KPI Preference (from kpi_preferences table)
// ============================================
export interface KpiPreference {
  id: string;
  fundId: string;
  kpiId: string;
  isFeatured: boolean;
  isEnabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Combined definition with preference
export interface KpiDefinitionWithPreference extends KpiDefinition {
  preference: KpiPreference | null;
}

// ============================================
// KPI Data (from kpi_data table)
// ============================================
export interface KpiDataPoint {
  id: string;
  dealId: string;
  kpiId: string;
  periodType: KpiPeriodType;
  periodDate: string;
  dataType: KpiDataType;
  value: number;
  source: KpiSource;
  sourceRef: string | null;
  importedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

// KPI data with definition info (for display)
export interface KpiDataWithDefinition extends KpiDataPoint {
  definition: KpiDefinition;
}

// ============================================
// KPI Display Types (for frontend)
// ============================================
export interface KpiDisplayValue {
  kpiId: string;
  code: string;
  name: string;
  category: KpiCategory;
  format: KpiFormat;
  value: number | null;
  previousValue: number | null;
  changePercent: number | null;
  periodDate: string;
  dataType: KpiDataType;
}

export interface KpiCardData {
  id: string;
  code: string;
  name: string;
  value: string; // Formatted value
  rawValue: number | null;
  change: number | null; // Percentage change
  changeLabel: string;
  format: KpiFormat;
  category: KpiCategory;
  icon?: string;
  iconBg?: string;
}

// ============================================
// KPI Time Series (for charts)
// ============================================
export interface KpiTimeSeriesPoint {
  date: string;
  actual: number | null;
  forecast: number | null;
  budget: number | null;
}

export interface KpiTimeSeries {
  kpiId: string;
  code: string;
  name: string;
  format: KpiFormat;
  data: KpiTimeSeriesPoint[];
}

// ============================================
// Financial Statements
// ============================================
export type StatementType = 'income' | 'balance_sheet' | 'cash_flow';

export interface FinancialStatementLineItem {
  label: string;
  value: number;
  isSubtotal?: boolean;
  isTotal?: boolean;
  indent?: number;
}

export interface FinancialStatementSection {
  title: string;
  items: FinancialStatementLineItem[];
  subtotal?: number;
}

export interface FinancialStatementData {
  sections: FinancialStatementSection[];
  total?: number;
}

export interface FinancialStatement {
  id: string;
  dealId: string;
  statementType: StatementType;
  periodDate: string;
  data: FinancialStatementData;
  source: KpiSource;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

// ============================================
// Data Connections
// ============================================
export type DataConnectionProvider = 'google_sheets' | 'excel';

export type SyncStatus = 'pending' | 'syncing' | 'success' | 'error';

export interface ColumnMapping {
  columnName: string;
  kpiCode: string;
  dataType: KpiDataType;
}

export interface DataConnection {
  id: string;
  fundId: string;
  dealId: string | null;
  dealName?: string; // Populated when fetching with deal info
  provider: DataConnectionProvider;
  name: string;
  spreadsheetId: string | null;
  columnMapping: ColumnMapping[];
  lastSyncedAt: string | null;
  syncStatus: SyncStatus;
  syncError: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// API Request/Response Types
// ============================================
// Note: KpiDataWriteInput and KpiPreferenceUpdateInput are defined in kpi.schema.ts
// to avoid duplication with Zod inferred types

export interface KpiPreferencesUpdateRequest {
  preferences: {
    kpiId: string;
    isFeatured?: boolean;
    isEnabled?: boolean;
    sortOrder?: number;
  }[];
}

export interface DealKpiSummary {
  dealId: string;
  dealName: string;
  featured: KpiCardData[];
  byCategory: Record<KpiCategory, KpiCardData[]>;
  lastUpdated: string | null;
}

// ============================================
// Category Metadata
// ============================================
export interface KpiCategoryInfo {
  code: KpiCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const KPI_CATEGORY_INFO: KpiCategoryInfo[] = [
  {
    code: 'rent_revenue',
    name: 'Rent/Revenue',
    description: 'Income and revenue metrics',
    icon: 'DollarSign',
    color: 'emerald',
  },
  {
    code: 'occupancy',
    name: 'Occupancy',
    description: 'Occupancy and vacancy metrics',
    icon: 'Home',
    color: 'blue',
  },
  {
    code: 'property_performance',
    name: 'Performance',
    description: 'Property performance indicators',
    icon: 'TrendingUp',
    color: 'purple',
  },
  {
    code: 'financial',
    name: 'Financial',
    description: 'Financial returns and metrics',
    icon: 'BarChart3',
    color: 'indigo',
  },
  {
    code: 'debt_service',
    name: 'Debt Service',
    description: 'Loan and debt metrics',
    icon: 'CreditCard',
    color: 'orange',
  },
];

// ============================================
// KPI Outliers (Exceptions Dashboard)
// ============================================
export type OutlierComparisonBaseline = 'forecast' | 'budget' | 'last_period';

export type OutlierStatus = 'green' | 'yellow' | 'red';

/** Per-fund, per-KPI outlier detection configuration */
export interface KpiOutlierConfig {
  id: string;
  fundId: string;
  kpiId: string;
  alertThreshold: number;
  comparisonBaseline: OutlierComparisonBaseline;
  greenThreshold: number;
  redThreshold: number;
  isInverseMetric: boolean;
  enabledInOutliers: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A single KPI identified as an outlier */
export interface KpiOutlier {
  kpiId: string;
  kpiCode: string;
  kpiName: string;
  category: KpiCategory;
  variancePercent: number;
  actualValue: number;
  baselineValue: number;
  baselineType: OutlierComparisonBaseline;
  absoluteDifference: number;
  status: OutlierStatus;
  format: KpiFormat;
}

/** API response for deal outliers */
export interface OutliersResponse {
  dealId: string;
  topPerformers: KpiOutlier[];
  bottomPerformers: KpiOutlier[];
  lastUpdated: string | null;
  comparisonPeriod: string;
}

/** Request to update outlier configuration */
export interface OutlierConfigUpdateRequest {
  configs: {
    kpiId: string;
    alertThreshold?: number;
    comparisonBaseline?: OutlierComparisonBaseline;
    greenThreshold?: number;
    redThreshold?: number;
    isInverseMetric?: boolean;
    enabledInOutliers?: boolean;
  }[];
}

// ============================================
// Comparison View Types
// ============================================

/** View mode for KPI dashboard */
export type KpiViewMode = 
  | 'actual' 
  | 'forecast' 
  | 'budget' 
  | 'vs_forecast' 
  | 'vs_budget' 
  | 'vs_last_period';

/** Variance calculation result */
export interface KpiVariance {
  amount: number;
  percent: number | null; // null for percentage KPIs (show point diff instead)
  status: 'green' | 'yellow' | 'red' | 'neutral';
}

/** Extended KPI card data with all three dimension values */
export interface KpiCardDataWithDimensions extends KpiCardData {
  actualValue: number | null;
  forecastValue: number | null;
  budgetValue: number | null;
  previousPeriodValue: number | null;
  vsForecast: KpiVariance | null;
  vsBudget: KpiVariance | null;
  vsLastPeriod: KpiVariance | null;
  isInverseMetric: boolean;
}

/** Summary response with all dimension data for comparison views */
export interface DealKpiSummaryWithDimensions {
  dealId: string;
  dealName: string;
  featured: KpiCardDataWithDimensions[];
  byCategory: Record<KpiCategory, KpiCardDataWithDimensions[]>;
  lastUpdated: string | null;
}

/** Default inverse metrics (lower is better) */
export const DEFAULT_INVERSE_METRIC_CODES = [
  'operating_expense_ratio',
  'vacancy_rate',
  'loss_to_lease',
  'concessions',
  'total_expenses',
  'expense_per_unit',
  'ltv',
  'avg_days_vacant',
  'move_outs',
];

