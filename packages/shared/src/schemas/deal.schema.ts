import { z } from 'zod';
import { DEAL_STATUS, PROPERTY_TYPE } from '../constants/status';

export const createDealSchema = z.object({
  fundId: z.string().uuid(),
  name: z.string().min(1, 'Deal name is required'),
  description: z.string().optional(),
  status: z.enum(Object.values(DEAL_STATUS) as [string, ...string[]]).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  propertyType: z.enum(Object.values(PROPERTY_TYPE) as [string, ...string[]]).optional(),
  unitCount: z.number().int().nonnegative().optional(),
  squareFootage: z.number().int().nonnegative().optional(),
  acquisitionPrice: z.number().nonnegative().optional(),
  acquisitionDate: z.string().optional(),
  currentValue: z.number().nonnegative().optional(),
  totalInvestment: z.number().nonnegative().optional(),
  kpis: z.object({
    noi: z.number().optional(),
    capRate: z.number().optional(),
    cashOnCash: z.number().optional(),
    occupancyRate: z.number().optional(),
    renovationBudget: z.number().optional(),
    renovationSpent: z.number().optional(),
  }).optional(),
});

export const updateDealSchema = createDealSchema.partial();

export const updateKPIsSchema = z.object({
  kpis: z.object({
    noi: z.number().optional(),
    capRate: z.number().optional(),
    cashOnCash: z.number().optional(),
    occupancyRate: z.number().optional(),
    renovationBudget: z.number().optional(),
    renovationSpent: z.number().optional(),
  }),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type UpdateKPIsInput = z.infer<typeof updateKPIsSchema>;

