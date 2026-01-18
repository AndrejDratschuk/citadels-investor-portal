/**
 * Funds Schemas (Boundary Validation)
 * Zod schemas for validating API input - following CODE_GUIDELINES.md
 */

import { z } from 'zod';

// ============================================
// Email Customization Schemas
// ============================================

export const updateEmailCustomizationSchema = z.object({
  // Pre-meeting materials
  preMeetingMaterialsType: z.enum(['website', 'teaser_doc']).nullable().optional(),
  preMeetingMaterialsUrl: z.string().url().nullable().optional()
    .or(z.literal('').transform(() => null))
    .or(z.null()),
  
  // Accreditation education
  accreditationEducationType: z.enum(['standard_video', 'custom_text']).optional(),
  accreditationEducationContent: z.string().nullable().optional(),
  
  // Post-meeting communication
  postMeetingRecapTemplate: z.string().nullable().optional(),
  
  // Nurture content
  consideringSupportMessage: z.string().nullable().optional(),
  nurtureUpdateTemplates: z.array(z.string()).max(5).optional(),
  
  // Investor onboarding
  documentReviewTimeframe: z.string().nullable().optional(),
  welcomeMessage: z.string().nullable().optional(),
  
  // Transfer & exit messaging
  transferProcessNote: z.string().nullable().optional(),
  transferNextSteps: z.string().nullable().optional(),
  transferDenialOptions: z.string().nullable().optional(),
  exitClosingMessage: z.string().nullable().optional(),
  
  // Team credentials
  userCredentials: z.string().nullable().optional(),
});

export type UpdateEmailCustomizationInput = z.infer<typeof updateEmailCustomizationSchema>;
