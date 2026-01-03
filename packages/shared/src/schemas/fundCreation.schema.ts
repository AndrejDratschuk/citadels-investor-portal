import { z } from 'zod';

/**
 * Fund Creation Schemas
 * Zod validation schemas for enhanced signup and fund creation wizard
 */

export const fundTypeSchema = z.enum([
  'vc',
  'pe',
  'real_estate',
  'hedge_fund',
  'family_office',
  'search_fund',
  'other',
]);

export const displayRoleSchema = z.enum([
  'general_partner',
  'managing_partner',
  'fund_manager',
  'fund_administrator',
  'cfo',
  'other',
]);

/**
 * Enhanced signup schema with name fields and password confirmation
 * Used at API boundary for validation
 */
export const enhancedSignupSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms of service' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Schema for creating a new fund
 * Used in the fund creation wizard after signup
 */
export const createFundSchema = z.object({
  name: z
    .string()
    .min(2, 'Fund name must be at least 2 characters')
    .max(100, 'Fund name must be less than 100 characters'),
  fundType: fundTypeSchema,
  displayRole: displayRoleSchema,
  entityName: z
    .string()
    .max(200, 'Entity name must be less than 200 characters')
    .optional(),
  country: z.string().min(2, 'Country is required').max(100),
});

/**
 * Schema for the combined signup + fund creation flow (if done in one step)
 */
export const signupWithFundSchema = enhancedSignupSchema.and(
  z.object({
    fund: createFundSchema,
  })
);

// Export inferred types
export type EnhancedSignupInput = z.infer<typeof enhancedSignupSchema>;
export type CreateFundInput = z.infer<typeof createFundSchema>;
export type SignupWithFundInput = z.infer<typeof signupWithFundSchema>;
export type FundType = z.infer<typeof fundTypeSchema>;
export type DisplayRole = z.infer<typeof displayRoleSchema>;

