import { z } from 'zod';

/**
 * Team Invite Schemas
 * Zod validation schemas for team invitation system
 */

export const teamRoleSchema = z.enum(['manager', 'accountant', 'attorney', 'investor']);
export const inviteStatusSchema = z.enum(['pending', 'accepted', 'expired', 'cancelled']);

/**
 * Schema for creating a new team invite
 * Used at API boundary for validation
 */
export const createTeamInviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: teamRoleSchema,
});

/**
 * Schema for accepting a team invite
 * Password and name fields are optional (only required for new users)
 */
export const acceptTeamInviteSchema = z.object({
  token: z.string().length(64, 'Invalid invite token'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
});

/**
 * Schema for validating token query parameter
 */
export const verifyTeamInviteTokenSchema = z.object({
  token: z.string().length(64, 'Invalid invite token'),
});

/**
 * Schema for canceling an invite
 */
export const cancelTeamInviteSchema = z.object({
  inviteId: z.string().uuid('Invalid invite ID'),
});

/**
 * Schema for resending an invite
 */
export const resendTeamInviteSchema = z.object({
  inviteId: z.string().uuid('Invalid invite ID'),
});

/**
 * Schema for updating a team member's role
 */
export const updateTeamMemberRoleSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: teamRoleSchema,
});

/**
 * Schema for removing a team member
 */
export const removeTeamMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

// Export inferred types
export type CreateTeamInviteInput = z.infer<typeof createTeamInviteSchema>;
export type AcceptTeamInviteInput = z.infer<typeof acceptTeamInviteSchema>;
export type VerifyTeamInviteTokenInput = z.infer<typeof verifyTeamInviteTokenSchema>;
export type CancelTeamInviteInput = z.infer<typeof cancelTeamInviteSchema>;
export type ResendTeamInviteInput = z.infer<typeof resendTeamInviteSchema>;
export type UpdateTeamMemberRoleInput = z.infer<typeof updateTeamMemberRoleSchema>;
export type RemoveTeamMemberInput = z.infer<typeof removeTeamMemberSchema>;

