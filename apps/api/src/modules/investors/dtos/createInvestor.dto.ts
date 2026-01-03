import { z } from 'zod';
import { INVESTOR_TYPE } from '@altsui/shared';

const investorTypeValues = Object.values(INVESTOR_TYPE) as [string, ...string[]];

export const createInvestorSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(1).max(50).optional(),
  commitmentAmount: z.number().nonnegative().optional(),
  investorType: z.enum(investorTypeValues).optional().default('limited_partner'),
});

export type CreateInvestorDto = z.infer<typeof createInvestorSchema>;


