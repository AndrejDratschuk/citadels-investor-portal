import { z } from 'zod';

// ============================================================================
// Validation Document Types
// ============================================================================

/**
 * Types of validation documents that can be uploaded by investors
 */
export const validationDocumentTypeSchema = z.enum([
  'tax_filing',
  'proof_of_identity',
  'net_worth_statement',
  'bank_statement',
  'other',
]);

export type ValidationDocumentType = z.infer<typeof validationDocumentTypeSchema>;

/**
 * Labels for validation document types
 */
export const validationDocumentTypeLabels: Record<ValidationDocumentType, string> = {
  tax_filing: 'Tax Filing',
  proof_of_identity: 'Proof of Identity',
  net_worth_statement: 'Net Worth Statement',
  bank_statement: 'Bank Statement',
  other: 'Other',
};

/**
 * Allowed MIME types for document uploads
 */
export const allowedMimeTypesSchema = z.enum([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export type AllowedMimeType = z.infer<typeof allowedMimeTypesSchema>;

/**
 * Labels for MIME types
 */
export const mimeTypeLabels: Record<AllowedMimeType, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPEG Image',
  'image/png': 'PNG Image',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
};

/**
 * File extensions allowed for upload
 */
export const allowedFileExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.docx'];

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ============================================================================
// Validation Document Input Schemas
// ============================================================================

/**
 * Schema for uploading a validation document
 */
export const uploadValidationDocumentSchema = z.object({
  documentType: validationDocumentTypeSchema,
  customName: z.string().max(100, 'Name must be 100 characters or less').optional(),
  fileSize: z
    .number()
    .max(MAX_FILE_SIZE, `File must be under ${MAX_FILE_SIZE / 1024 / 1024}MB`),
  mimeType: allowedMimeTypesSchema,
});

/**
 * Schema for a pending upload (before actual file upload)
 */
export const pendingUploadSchema = z.object({
  file: z.any(), // File object from browser
  documentType: validationDocumentTypeSchema,
  customName: z.string().max(100).optional(),
  uploadProgress: z.number().min(0).max(100).optional(),
});

/**
 * Schema for approving a validation document
 */
export const approveDocumentInputSchema = z.object({
  documentId: z.string().uuid('Invalid document ID'),
  triggerDocusign: z.boolean().default(false),
});

/**
 * Schema for rejecting a validation document
 */
export const rejectDocumentInputSchema = z.object({
  documentId: z.string().uuid('Invalid document ID'),
  reason: z.string().min(10, 'Please provide a detailed reason (at least 10 characters)'),
});

// ============================================================================
// Validation Document Response Schemas
// ============================================================================

/**
 * Validation status for documents
 */
export const validationStatusSchema = z.enum(['pending', 'approved', 'rejected']);

export type ValidationStatus = z.infer<typeof validationStatusSchema>;

/**
 * Labels for validation statuses
 */
export const validationStatusLabels: Record<ValidationStatus, string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

/**
 * Colors for validation status badges
 */
export const validationStatusColors: Record<ValidationStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
  approved: { bg: 'bg-green-100', text: 'text-green-700' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700' },
};

/**
 * Schema for a validation document record
 */
export const validationDocumentSchema = z.object({
  id: z.string().uuid(),
  investorId: z.string().uuid(),
  fundId: z.string().uuid(),
  name: z.string(),
  documentType: validationDocumentTypeSchema,
  filePath: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  subcategory: z.literal('validation'),
  validationStatus: validationStatusSchema,
  uploadedBy: z.literal('investor'),
  uploadedAt: z.string().datetime(),
  validatedBy: z.string().uuid().nullable(),
  validatedAt: z.string().datetime().nullable(),
  rejectionReason: z.string().nullable(),
});

/**
 * Schema for approval response
 */
export const approveDocumentResponseSchema = z.object({
  success: z.boolean(),
  document: validationDocumentSchema.optional(),
  docusignEnvelopeId: z.string().optional(),
});

/**
 * Schema for rejection response
 */
export const rejectDocumentResponseSchema = z.object({
  success: z.boolean(),
  document: validationDocumentSchema.optional(),
  emailSent: z.boolean(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type UploadValidationDocument = z.infer<typeof uploadValidationDocumentSchema>;
export type PendingUpload = z.infer<typeof pendingUploadSchema>;
export type ApproveDocumentInput = z.infer<typeof approveDocumentInputSchema>;
export type RejectDocumentInput = z.infer<typeof rejectDocumentInputSchema>;
export type ValidationDocument = z.infer<typeof validationDocumentSchema>;
export type ApproveDocumentResponse = z.infer<typeof approveDocumentResponseSchema>;
export type RejectDocumentResponse = z.infer<typeof rejectDocumentResponseSchema>;

