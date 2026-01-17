import { z } from 'zod';

// Visibility options for notes
export const noteVisibilitySchema = z.enum(['manager', 'accountant', 'attorney', 'investor']);

// Milestone status options
export const milestoneStatusSchema = z.enum(['planned', 'in_progress', 'completed', 'delayed']);

// Milestone category options
export const milestoneCategorySchema = z.enum([
  'acquisition',
  'renovation',
  'financing',
  'operations',
  'disposition',
  'other',
]);

// Create Note Schema
export const createDealNoteSchema = z.object({
  dealId: z.string().uuid(),
  content: z.string().min(1, 'Content is required').max(10000),
  visibility: z.array(noteVisibilitySchema).min(1, 'At least one visibility role is required'),
});

// Update Note Schema
export const updateDealNoteSchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  visibility: z.array(noteVisibilitySchema).min(1).optional(),
});

// Create Milestone Schema
export const createDealMilestoneSchema = z.object({
  dealId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: milestoneStatusSchema.optional().default('planned'),
  category: milestoneCategorySchema.optional().default('other'),
  sortOrder: z.number().int().optional(),
});

// Update Milestone Schema
export const updateDealMilestoneSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  status: milestoneStatusSchema.optional(),
  category: milestoneCategorySchema.optional(),
  actualStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  actualCompletionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

// Type exports from schemas
export type CreateDealNoteSchema = z.infer<typeof createDealNoteSchema>;
export type UpdateDealNoteSchema = z.infer<typeof updateDealNoteSchema>;
export type CreateDealMilestoneSchema = z.infer<typeof createDealMilestoneSchema>;
export type UpdateDealMilestoneSchema = z.infer<typeof updateDealMilestoneSchema>;

