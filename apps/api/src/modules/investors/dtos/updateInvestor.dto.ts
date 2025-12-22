import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  zip: z.string().trim().max(20).optional(),
  country: z.string().trim().max(100).optional(),
});

export const updateInvestorSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().email().max(320).optional(),
  phone: z.string().trim().min(1).max(50).optional().nullable(),
  address: addressSchema.optional().nullable(),
  entityType: z.enum(['individual', 'trust', 'llc', 'corporation', 'partnership']).optional().nullable(),
  entityName: z.string().trim().max(200).optional().nullable(),
  commitmentAmount: z.number().nonnegative().optional(),
  status: z.enum(['pending', 'active', 'inactive']).optional(),
});

export type UpdateInvestorDto = z.infer<typeof updateInvestorSchema>;

