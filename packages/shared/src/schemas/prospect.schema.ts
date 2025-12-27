import { z } from 'zod';
import { PROSPECT_STATUS, PROSPECT_SOURCE } from '../constants/status';

// Status values as array for Zod enum
const PROSPECT_STATUS_VALUES = Object.values(PROSPECT_STATUS) as [string, ...string[]];
const PROSPECT_SOURCE_VALUES = Object.values(PROSPECT_SOURCE) as [string, ...string[]];

/**
 * Schema for sending a KYC form to a prospect (manual send)
 */
export const SendKYCInputSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export type SendKYCInput = z.infer<typeof SendKYCInputSchema>;

/**
 * Schema for updating prospect status
 */
export const UpdateProspectStatusInputSchema = z.object({
  status: z.enum(PROSPECT_STATUS_VALUES),
  reason: z.string().optional(),
});

export type UpdateProspectStatusInput = z.infer<typeof UpdateProspectStatusInputSchema>;

/**
 * Schema for approving documents
 */
export const ApproveDocumentsInputSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1, 'At least one document ID required'),
});

export type ApproveDocumentsInput = z.infer<typeof ApproveDocumentsInputSchema>;

/**
 * Schema for rejecting documents
 */
export const RejectDocumentsInputSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1, 'At least one document ID required'),
  reason: z.string().min(1, 'Rejection reason is required'),
});

export type RejectDocumentsInput = z.infer<typeof RejectDocumentsInputSchema>;

/**
 * Schema for converting prospect to investor
 */
export const ConvertToInvestorInputSchema = z.object({
  commitmentAmount: z.number().positive('Commitment amount must be positive'),
});

export type ConvertToInvestorInput = z.infer<typeof ConvertToInvestorInputSchema>;

/**
 * Schema for interest form submission (simple public form)
 */
export const InterestFormInputSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  fundId: z.string().uuid('Invalid fund ID'),
});

export type InterestFormInput = z.infer<typeof InterestFormInputSchema>;

/**
 * Schema for prospect query filters
 */
export const ProspectFiltersSchema = z.object({
  status: z.union([
    z.enum(PROSPECT_STATUS_VALUES),
    z.array(z.enum(PROSPECT_STATUS_VALUES)),
  ]).optional(),
  source: z.enum(PROSPECT_SOURCE_VALUES).optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type ProspectFiltersInput = z.infer<typeof ProspectFiltersSchema>;

/**
 * Schema for sending reminder
 */
export const SendReminderInputSchema = z.object({
  type: z.enum(['kyc', 'onboarding', 'documents']),
});

export type SendReminderInput = z.infer<typeof SendReminderInputSchema>;

