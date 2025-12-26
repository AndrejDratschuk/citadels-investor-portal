import { z } from 'zod';

// ============================================================================
// Account Creation Input Schemas
// ============================================================================

/**
 * Schema for validating account creation token verification
 */
export const verifyTokenInputSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

/**
 * Schema for sending verification code during account creation
 */
export const sendVerificationCodeInputSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

/**
 * Schema for creating a new investor account
 */
export const createAccountInputSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  verificationCode: z
    .string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d+$/, 'Verification code must contain only digits'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * Schema for fund manager sending account creation invite
 */
export const sendAccountInviteInputSchema = z.object({
  kycApplicationId: z.string().uuid('Invalid KYC application ID'),
  fundId: z.string().uuid('Invalid fund ID'),
});

// ============================================================================
// Account Creation Response Schemas
// ============================================================================

/**
 * Response schema for token verification
 */
export const verifyTokenResponseSchema = z.object({
  valid: z.boolean(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  kycApplicationId: z.string().uuid(),
  fundId: z.string().uuid(),
  fundName: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

/**
 * Response schema for sending verification code
 */
export const sendCodeResponseSchema = z.object({
  sent: z.boolean(),
  expiresIn: z.number(), // seconds until expiration
});

/**
 * Response schema for account creation
 */
export const createAccountResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    role: z.literal('investor'),
  }),
  investor: z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    status: z.string(),
  }),
  accessToken: z.string(),
  refreshToken: z.string(),
});

/**
 * Response schema for sending account invite
 */
export const sendInviteResponseSchema = z.object({
  tokenId: z.string().uuid(),
  expiresAt: z.string().datetime(),
  emailSent: z.boolean(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type VerifyTokenInput = z.infer<typeof verifyTokenInputSchema>;
export type SendVerificationCodeInput = z.infer<typeof sendVerificationCodeInputSchema>;
export type CreateAccountInput = z.infer<typeof createAccountInputSchema>;
export type SendAccountInviteInput = z.infer<typeof sendAccountInviteInputSchema>;

export type VerifyTokenResponse = z.infer<typeof verifyTokenResponseSchema>;
export type SendCodeResponse = z.infer<typeof sendCodeResponseSchema>;
export type CreateAccountResponse = z.infer<typeof createAccountResponseSchema>;
export type SendInviteResponse = z.infer<typeof sendInviteResponseSchema>;

