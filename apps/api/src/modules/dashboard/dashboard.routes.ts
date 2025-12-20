/**
 * Dashboard Routes
 * Registers endpoints for dashboard metrics
 */

import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { dashboardController } from './dashboard.controller.js';

export async function dashboardRoutes(fastify: FastifyInstance): Promise<void> {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);

  // GET /dashboard/metrics - Get all dashboard KPIs
  fastify.get('/metrics', dashboardController.getMetrics.bind(dashboardController));
}

