/**
 * Dashboard Schemas (Boundary Validation)
 * Zod schemas for validating API input - following CODE_GUIDELINES.md
 */

import { z } from 'zod';

// ============================================
// Query Parameter Schemas
// ============================================

export const dashboardStatsQuerySchema = z.object({
  includeKpis: z
    .enum(['true', 'false'])
    .optional()
    .default('true')
    .transform((val) => val === 'true'),
  kpiLimit: z.coerce.number().min(1).max(20).optional().default(5),
});

export type DashboardStatsQuery = z.infer<typeof dashboardStatsQuerySchema>;




