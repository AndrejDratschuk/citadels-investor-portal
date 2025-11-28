import { z } from 'zod';
import { CAPITAL_CALL_STATUS } from '../constants/status';

export const createCapitalCallSchema = z.object({
  fundId: z.string().uuid(),
  dealId: z.string().uuid(),
  totalAmount: z.number().positive('Total amount must be positive'),
  percentageOfFund: z.number().min(0).max(1, 'Percentage must be between 0 and 1'),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline must be in YYYY-MM-DD format'),
});

export const updateCapitalCallSchema = createCapitalCallSchema.partial().extend({
  status: z.enum(Object.values(CAPITAL_CALL_STATUS) as [string, ...string[]]).optional(),
});

export const updateCapitalCallItemSchema = z.object({
  amountReceived: z.number().nonnegative(),
  wireReceivedAt: z.string().optional(),
});

export type CreateCapitalCallInput = z.infer<typeof createCapitalCallSchema>;
export type UpdateCapitalCallInput = z.infer<typeof updateCapitalCallSchema>;
export type UpdateCapitalCallItemInput = z.infer<typeof updateCapitalCallItemSchema>;

