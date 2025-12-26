import { z } from 'zod';

// ============================================
// Constants for validation
// ============================================
export const KPI_CATEGORIES = [
  'rent_revenue',
  'occupancy',
  'property_performance',
  'financial',
  'debt_service',
] as const;

export const KPI_FORMATS = ['currency', 'percentage', 'number', 'ratio'] as const;

export const KPI_PERIOD_TYPES = ['monthly', 'quarterly', 'yearly'] as const;

export const KPI_DATA_TYPES = ['actual', 'forecast', 'budget'] as const;

export const KPI_SOURCES = ['manual', 'google_sheets', 'excel'] as const;

export const STATEMENT_TYPES = ['income', 'balance_sheet', 'cash_flow'] as const;

export const DATA_PROVIDERS = ['google_sheets', 'excel'] as const;

// ============================================
// KPI Data Schemas
// ============================================

/** Schema for writing a single KPI data point */
export const kpiDataWriteSchema = z.object({
  kpiId: z.string().uuid('Invalid KPI ID'),
  periodType: z.enum(KPI_PERIOD_TYPES),
  periodDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  dataType: z.enum(KPI_DATA_TYPES),
  value: z.number(),
  source: z.enum(KPI_SOURCES).optional().default('manual'),
  sourceRef: z.string().optional(),
});

/** Schema for writing multiple KPI data points */
export const kpiDataBulkWriteSchema = z.object({
  data: z.array(kpiDataWriteSchema).min(1, 'At least one data point required'),
});

// ============================================
// KPI Preferences Schemas
// ============================================

/** Schema for updating a single KPI preference */
export const kpiPreferenceUpdateSchema = z.object({
  kpiId: z.string().uuid('Invalid KPI ID'),
  isFeatured: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

/** Schema for updating multiple KPI preferences */
export const kpiPreferencesUpdateSchema = z.object({
  preferences: z.array(kpiPreferenceUpdateSchema).min(1, 'At least one preference required'),
});

// ============================================
// Financial Statement Schemas
// ============================================

/** Schema for a financial statement line item */
export const statementLineItemSchema = z.object({
  label: z.string().min(1),
  value: z.number(),
  isSubtotal: z.boolean().optional(),
  isTotal: z.boolean().optional(),
  indent: z.number().int().nonnegative().optional(),
});

/** Schema for a financial statement section */
export const statementSectionSchema = z.object({
  title: z.string().min(1),
  items: z.array(statementLineItemSchema),
  subtotal: z.number().optional(),
});

/** Schema for financial statement data */
export const statementDataSchema = z.object({
  sections: z.array(statementSectionSchema),
  total: z.number().optional(),
});

/** Schema for creating/updating a financial statement */
export const financialStatementWriteSchema = z.object({
  statementType: z.enum(STATEMENT_TYPES),
  periodDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  data: statementDataSchema,
  source: z.enum(KPI_SOURCES).optional().default('manual'),
});

// ============================================
// Data Connection Schemas
// ============================================

/** Schema for column mapping configuration */
export const columnMappingSchema = z.object({
  columnName: z.string().min(1, 'Column name required'),
  kpiCode: z.string().min(1, 'KPI code required'),
  dataType: z.enum(KPI_DATA_TYPES),
});

/** Schema for creating a Google Sheets connection */
export const googleSheetsConnectSchema = z.object({
  name: z.string().min(1, 'Connection name required'),
  spreadsheetId: z.string().min(1, 'Spreadsheet ID required'),
  accessToken: z.string().min(1, 'Access token required'),
  refreshToken: z.string().min(1, 'Refresh token required'),
});

/** Schema for updating column mapping */
export const columnMappingUpdateSchema = z.object({
  mappings: z.array(columnMappingSchema),
});

/** Schema for Excel file import */
export const excelImportSchema = z.object({
  name: z.string().min(1, 'Import name required'),
  mappings: z.array(columnMappingSchema).min(1, 'At least one column mapping required'),
});

// ============================================
// Query Parameter Schemas
// ============================================

/** Schema for KPI data query parameters */
export const kpiDataQuerySchema = z.object({
  category: z.enum(KPI_CATEGORIES).optional(),
  dataType: z.enum(KPI_DATA_TYPES).optional(),
  periodType: z.enum(KPI_PERIOD_TYPES).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// ============================================
// Type Exports
// ============================================
export type KpiDataWriteInput = z.infer<typeof kpiDataWriteSchema>;
export type KpiDataBulkWriteInput = z.infer<typeof kpiDataBulkWriteSchema>;
export type KpiPreferenceUpdateInput = z.infer<typeof kpiPreferenceUpdateSchema>;
export type KpiPreferencesUpdateInput = z.infer<typeof kpiPreferencesUpdateSchema>;
export type FinancialStatementWriteInput = z.infer<typeof financialStatementWriteSchema>;
export type GoogleSheetsConnectInput = z.infer<typeof googleSheetsConnectSchema>;
export type ColumnMappingUpdateInput = z.infer<typeof columnMappingUpdateSchema>;
export type ExcelImportInput = z.infer<typeof excelImportSchema>;
export type KpiDataQueryInput = z.infer<typeof kpiDataQuerySchema>;

