import { z } from 'zod';
import { FUND_STATUS } from '../constants/status';

export const createFundSchema = z.object({
  name: z.string().min(1, 'Fund name is required'),
  legalName: z.string().min(1, 'Legal name is required'),
  ein: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  wireInstructions: z.string().optional(),
  targetRaise: z.number().nonnegative().optional(),
  branding: z.object({
    logoUrl: z.string().url().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
  }).optional(),
});

export const updateFundSchema = createFundSchema.partial().extend({
  status: z.enum(Object.values(FUND_STATUS) as [string, ...string[]]).optional(),
});

export type CreateFundInput = z.infer<typeof createFundSchema>;
export type UpdateFundInput = z.infer<typeof updateFundSchema>;

