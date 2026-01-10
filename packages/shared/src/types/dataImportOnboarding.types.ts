/**
 * Data Import Onboarding Types
 * Anemic data types for the guided data import experience
 * No methods, no logic - pure data structures
 */

import type { KpiDataType } from './kpi.types';

// ============================================
// File Parsing Types
// ============================================

/** Supported file types for data import */
export type ImportFileType = 'csv' | 'xlsx' | 'xls';

/** Result of parsing an uploaded file */
export interface ParsedFileData {
  readonly columns: ReadonlyArray<string>;
  readonly rows: ReadonlyArray<Record<string, unknown>>;
  readonly rowCount: number;
  readonly previewRows: ReadonlyArray<Record<string, unknown>>;
  readonly fileType: ImportFileType;
  readonly fileName: string;
}

// ============================================
// Column Mapping Types
// ============================================

/** Confidence level for auto-suggested mappings */
export type MappingConfidence = 'high' | 'medium' | 'low' | 'none';

/** Auto-suggested column to KPI mapping */
export interface SuggestedMapping {
  readonly columnName: string;
  readonly suggestedKpiCode: string | null;
  readonly suggestedKpiName: string | null;
  readonly confidence: MappingConfidence;
  readonly confidenceScore: number;
  readonly include: boolean;
  readonly dataType: KpiDataType;
}

/** User-confirmed column mapping */
export interface ConfirmedMapping {
  readonly columnName: string;
  readonly kpiCode: string;
  readonly kpiId: string;
  readonly dataType: KpiDataType;
  readonly include: boolean;
}

/** Column info with detected data type */
export interface ColumnInfo {
  readonly name: string;
  readonly detectedType: 'date' | 'number' | 'currency' | 'percentage' | 'text';
  readonly sampleValues: ReadonlyArray<unknown>;
  readonly nullCount: number;
}

// ============================================
// Import Result Types
// ============================================

/** Result of a data import operation */
export interface ImportResult {
  readonly success: boolean;
  readonly rowsImported: number;
  readonly rowsSkipped: number;
  readonly columnsMapped: number;
  readonly errors: ReadonlyArray<ImportError>;
  readonly connectionId: string | null;
  readonly importedAt: string | null;
}

/** Individual import error */
export interface ImportError {
  readonly row: number | null;
  readonly column: string | null;
  readonly message: string;
  readonly severity: 'error' | 'warning';
}

// ============================================
// Onboarding Tour State
// ============================================

/** State of the guided onboarding tour */
export interface OnboardingTourState {
  readonly isActive: boolean;
  readonly currentStep: number;
  readonly totalSteps: number;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
  readonly skippedAt: string | null;
}

/** Individual tour step definition */
export interface TourStep {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly targetSelector: string | null;
  readonly position: 'top' | 'bottom' | 'left' | 'right';
  readonly canSkip: boolean;
}

// ============================================
// Data Source Types
// ============================================

/** Available data source options */
export type DataSourceType = 'csv' | 'google_sheets' | 'sample';

/** Data source card info for selection */
export interface DataSourceOption {
  readonly type: DataSourceType;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly isRecommended: boolean;
  readonly isAvailable: boolean;
}

// ============================================
// Onboarding Flow State
// ============================================

/** Steps in the data import onboarding flow */
export type DataImportStep =
  | 'welcome'
  | 'source-selection'
  | 'file-upload'
  | 'column-mapping'
  | 'import-progress'
  | 'success'
  | 'ai-dashboard';

/** Complete state of the data import onboarding */
export interface DataImportOnboardingState {
  readonly currentStep: DataImportStep;
  readonly fundId: string;
  readonly dealId: string | null;
  readonly selectedSource: DataSourceType | null;
  readonly parsedFile: ParsedFileData | null;
  readonly suggestedMappings: ReadonlyArray<SuggestedMapping>;
  readonly confirmedMappings: ReadonlyArray<ConfirmedMapping>;
  readonly importResult: ImportResult | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly useSampleData: boolean;
}

// ============================================
// Sample Data Types
// ============================================

/** Sample data row for demo/exploration */
export interface SampleDataRow {
  readonly date: string;
  readonly [kpiCode: string]: string | number;
}

/** Sample data configuration */
export interface SampleDataConfig {
  readonly name: string;
  readonly description: string;
  readonly propertyType: string;
  readonly columns: ReadonlyArray<string>;
  readonly rows: ReadonlyArray<SampleDataRow>;
}

// ============================================
// AI Dashboard Generation
// ============================================

/** Options for AI dashboard generation */
export interface AIDashboardOptions {
  readonly generateDashboard: boolean;
  readonly includeCharts: boolean;
  readonly includeTrends: boolean;
  readonly dontShowAgain: boolean;
}

/** Result of AI dashboard generation */
export interface AIDashboardResult {
  readonly success: boolean;
  readonly dashboardUrl: string | null;
  readonly widgetsCreated: number;
  readonly error: string | null;
}




