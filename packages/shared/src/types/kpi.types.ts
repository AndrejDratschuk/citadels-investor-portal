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
export interface KpiDataWriteInput {
  kpiId: string;
  periodType: KpiPeriodType;
  periodDate: string;
  dataType: KpiDataType;
  value: number;
  source?: KpiSource;
}

export interface KpiPreferenceUpdateInput {
  kpiId: string;
  isFeatured?: boolean;
  isEnabled?: boolean;
  sortOrder?: number;
}

export interface KpiPreferencesUpdateRequest {
  preferences: KpiPreferenceUpdateInput[];
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

export const KPI_CATEGORIES: KpiCategoryInfo[] = [
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

