import { z } from 'zod';

export const communicationTypeSchema = z.enum(['email', 'meeting', 'phone_call']);

export const communicationSourceSchema = z.enum(['manual', 'email_sync', 'ai_notetaker']);

export const callDirectionSchema = z.enum(['inbound', 'outbound']);

export const createPhoneCallSchema = z.object({
  investorId: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
  occurredAt: z.string().datetime(),
  callDirection: callDirectionSchema,
  callDurationMinutes: z.number().int().positive().optional(),
});

export const createEmailSchema = z.object({
  investorId: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
  occurredAt: z.string().datetime(),
  emailFrom: z.string().email(),
  emailTo: z.string().email(),
  externalId: z.string().optional(),
});

export const createMeetingSchema = z.object({
  investorId: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
  occurredAt: z.string().datetime(),
  meetingAttendees: z.array(z.string()).optional(),
  meetingDurationMinutes: z.number().int().positive().optional(),
  externalId: z.string().optional(),
});

export type CreatePhoneCallInput = z.infer<typeof createPhoneCallSchema>;
export type CreateEmailInput = z.infer<typeof createEmailSchema>;
export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;















