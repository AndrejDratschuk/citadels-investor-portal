/**
 * Data Import Onboarding Schemas
 * Zod validation schemas for boundary validation at API entry points
 */

import { z } from 'zod';
import { KPI_DATA_TYPES } from './kpi.schema';

// ============================================
// Constants
// ============================================

export const IMPORT_FILE_TYPES = ['csv', 'xlsx', 'xls'] as const;
export const DATA_SOURCE_TYPES = ['csv', 'google_sheets', 'sample'] as const;
export const MAPPING_CONFIDENCE_LEVELS = ['high', 'medium', 'low', 'none'] as const;
export const DATA_IMPORT_STEPS = [
  'welcome',
  'source-selection',
  'file-upload',
  'column-mapping',
  'import-progress',
  'success',
  'ai-dashboard',
] as const;

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ============================================
// File Upload Schemas
// ============================================

/** Validates file upload metadata */
export const fileUploadInputSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.enum(IMPORT_FILE_TYPES, {
    errorMap: () => ({ message: 'File type must be csv, xlsx, or xls' }),
  }),
  fileSize: z.number()
    .positive('File size must be positive')
    .max(MAX_FILE_SIZE, 'File size must not exceed 10MB'),
});

/** Validates parsed file data structure */
export const parsedFileDataSchema = z.object({
  columns: z.array(z.string()).min(1, 'At least one column required'),
  rows: z.array(z.record(z.unknown())),
  rowCount: z.number().nonnegative(),
  previewRows: z.array(z.record(z.unknown())).max(10),
  fileType: z.enum(IMPORT_FILE_TYPES),
  fileName: z.string(),
});

// ============================================
// Column Mapping Schemas
// ============================================

/** Validates a single column mapping input */
export const columnMappingInputSchema = z.object({
  columnName: z.string().min(1, 'Column name is required'),
  kpiCode: z.string().min(1, 'KPI code is required'),
  kpiId: z.string().uuid('Invalid KPI ID'),
  dataType: z.enum(KPI_DATA_TYPES),
  include: z.boolean(),
});

/** Validates suggested mapping from auto-detection */
export const suggestedMappingSchema = z.object({
  columnName: z.string(),
  suggestedKpiCode: z.string().nullable(),
  suggestedKpiName: z.string().nullable(),
  confidence: z.enum(MAPPING_CONFIDENCE_LEVELS),
  confidenceScore: z.number().min(0).max(1),
  include: z.boolean(),
  dataType: z.enum(KPI_DATA_TYPES),
});

/** Validates array of column mappings */
export const columnMappingsArraySchema = z.array(columnMappingInputSchema)
  .min(1, 'At least one column mapping is required')
  .refine(
    (mappings) => mappings.some(m => m.include),
    'At least one column must be included for import'
  );

// ============================================
// Import Request Schemas
// ============================================

/** Validates a full import request */
export const importRequestSchema = z.object({
  fundId: z.string().uuid('Invalid fund ID').optional(),
  dealId: z.string().uuid('Invalid deal ID').optional().nullable(),
  connectionName: z.string()
    .min(1, 'Connection name is required')
    .max(100, 'Connection name must not exceed 100 characters'),
  mappings: columnMappingsArraySchema,
  data: z.array(z.record(z.unknown())).min(1, 'At least one data row is required'),
});

/** Validates import with sample data */
export const sampleDataImportSchema = z.object({
  fundId: z.string().uuid('Invalid fund ID').optional(),
  dealId: z.string().uuid('Invalid deal ID').optional().nullable(),
  useSampleData: z.literal(true).optional(),
});

/** Validates file parse request */
export const parseFileRequestSchema = z.object({
  fundId: z.string().uuid('Invalid fund ID'),
});

// ============================================
// Column Mapping Suggestion Request
// ============================================

/** Validates column names for auto-suggestion */
export const suggestMappingsRequestSchema = z.object({
  columnNames: z.array(z.string()).min(1, 'At least one column name required'),
  sampleValues: z.record(z.array(z.unknown())).optional(),
});

// ============================================
// Import Result Schemas
// ============================================

/** Validates import error structure */
export const importErrorSchema = z.object({
  row: z.number().nullable(),
  column: z.string().nullable(),
  message: z.string(),
  severity: z.enum(['error', 'warning']),
});

/** Validates import result structure */
export const importResultSchema = z.object({
  success: z.boolean(),
  rowsImported: z.number().nonnegative(),
  rowsSkipped: z.number().nonnegative(),
  columnsMapped: z.number().nonnegative(),
  errors: z.array(importErrorSchema),
  connectionId: z.string().uuid().nullable(),
  importedAt: z.string().datetime().nullable(),
});

// ============================================
// AI Dashboard Schemas
// ============================================

/** Validates AI dashboard generation options */
export const aiDashboardOptionsSchema = z.object({
  generateDashboard: z.boolean(),
  includeCharts: z.boolean().default(true),
  includeTrends: z.boolean().default(true),
  dontShowAgain: z.boolean().default(false),
});

/** Validates AI dashboard request */
export const aiDashboardRequestSchema = z.object({
  fundId: z.string().uuid('Invalid fund ID'),
  dealId: z.string().uuid('Invalid deal ID'),
  options: aiDashboardOptionsSchema,
});

// ============================================
// Tour State Schemas
// ============================================

/** Validates tour state updates */
export const tourStateUpdateSchema = z.object({
  tourId: z.string().min(1),
  action: z.enum(['start', 'next', 'skip', 'complete']),
  currentStep: z.number().nonnegative().optional(),
});

/** Validates tour completion */
export const tourCompletionSchema = z.object({
  tourId: z.string().min(1),
  completedAt: z.string().datetime(),
  finalStep: z.number().nonnegative(),
  usedSampleData: z.boolean(),
});

// ============================================
// Type Exports (inferred from schemas)
// ============================================

export type FileUploadInput = z.infer<typeof fileUploadInputSchema>;
export type ParsedFileDataInput = z.infer<typeof parsedFileDataSchema>;
export type ColumnMappingInput = z.infer<typeof columnMappingInputSchema>;
export type SuggestedMappingInput = z.infer<typeof suggestedMappingSchema>;
export type ImportRequestInput = z.infer<typeof importRequestSchema>;
export type SampleDataImportInput = z.infer<typeof sampleDataImportSchema>;
export type ParseFileRequestInput = z.infer<typeof parseFileRequestSchema>;
export type SuggestMappingsRequestInput = z.infer<typeof suggestMappingsRequestSchema>;
export type ImportErrorInput = z.infer<typeof importErrorSchema>;
export type ImportResultInput = z.infer<typeof importResultSchema>;
export type AIDashboardOptionsInput = z.infer<typeof aiDashboardOptionsSchema>;
export type AIDashboardRequestInput = z.infer<typeof aiDashboardRequestSchema>;
export type TourStateUpdateInput = z.infer<typeof tourStateUpdateSchema>;
export type TourCompletionInput = z.infer<typeof tourCompletionSchema>;

