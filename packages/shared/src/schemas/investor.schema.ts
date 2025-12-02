import { z } from 'zod';
import {
  ENTITY_TYPE,
  ACCREDITATION_STATUS,
} from '../constants/status';

const TAX_ID_TYPE_ARRAY = ['ssn', 'ein'] as const;

export const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
});

export const createInvestorSchema = z.object({
  fundId: z.string().uuid(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: addressSchema.optional(),
  entityType: z.enum(Object.values(ENTITY_TYPE) as [string, ...string[]]).optional(),
  entityName: z.string().optional(),
  taxIdType: z.enum(TAX_ID_TYPE_ARRAY).optional(),
});

export const updateInvestorSchema = createInvestorSchema.partial().extend({
  commitmentAmount: z.number().nonnegative().optional(),
});

export const kycSubmissionSchema = z.object({
  ssn: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: addressSchema,
  entityType: z.enum(Object.values(ENTITY_TYPE) as [string, ...string[]]),
  entityName: z.string().optional(),
  taxIdType: z.enum(TAX_ID_TYPE_ARRAY).optional(),
});

export const accreditationUpdateSchema = z.object({
  status: z.enum(Object.values(ACCREDITATION_STATUS) as [string, ...string[]]),
  type: z.string().optional(),
  accreditationDate: z.string().optional(),
  verificationRequestId: z.string().optional(),
});

export type CreateInvestorInput = z.infer<typeof createInvestorSchema>;
export type UpdateInvestorInput = z.infer<typeof updateInvestorSchema>;
export type KYCSubmissionInput = z.infer<typeof kycSubmissionSchema>;
export type AccreditationUpdateInput = z.infer<typeof accreditationUpdateSchema>;

