/**
 * KPI Routes
 * Route definitions for KPI endpoints
 */

import { FastifyInstance } from 'fastify';
import { kpisController } from './kpis.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireManager } from '../../common/middleware/rbac.middleware';

export async function kpisRoutes(fastify: FastifyInstance): Promise<void> {
  const authPreHandler = [authenticate];
  const managerPreHandler = [authenticate, requireManager];

  // ========== KPI Definitions (read-only for all authenticated users) ==========

  // Get all KPI definitions
  fastify.get('/definitions', { preHandler: authPreHandler }, async (request, reply) => {
    return kpisController.getAllDefinitions(request as any, reply);
  });

  // Get KPI definitions by category
  fastify.get('/definitions/:category', { preHandler: authPreHandler }, async (request, reply) => {
    return kpisController.getDefinitionsByCategory(request as any, reply);
  });

  // Get KPI definitions with fund preferences
  fastify.get('/definitions/with-preferences', { preHandler: authPreHandler }, async (request, reply) => {
    return kpisController.getDefinitionsWithPreferences(request as any, reply);
  });

  // ========== KPI Preferences (managers only) ==========

  // Get fund's KPI preferences
  fastify.get('/preferences', { preHandler: managerPreHandler }, async (request, reply) => {
    return kpisController.getPreferences(request as any, reply);
  });

  // Update fund's KPI preferences
  fastify.put('/preferences', { preHandler: managerPreHandler }, async (request, reply) => {
    return kpisController.updatePreferences(request as any, reply);
  });

  // ========== Outlier Configuration (managers only) ==========

  // Get fund's outlier configuration
  fastify.get('/outlier-config', { preHandler: managerPreHandler }, async (request, reply) => {
    return kpisController.getOutlierConfig(request as any, reply);
  });

  // Update fund's outlier configuration
  fastify.put('/outlier-config', { preHandler: managerPreHandler }, async (request, reply) => {
    return kpisController.updateOutlierConfig(request as any, reply);
  });
}

/**
 * Deal KPI Routes (nested under /deals/:dealId)
 * Should be registered separately or as part of deals routes
 */
export async function dealKpisRoutes(fastify: FastifyInstance): Promise<void> {
  const authPreHandler = [authenticate];
  const managerPreHandler = [authenticate, requireManager];

  // ========== Deal KPI Data ==========

  // Get deal's KPI data (with optional filters)
  fastify.get('/:dealId/kpis', { preHandler: authPreHandler }, async (request, reply) => {
    return kpisController.getDealKpis(request as any, reply);
  });

  // Get deal's KPI summary (formatted for display)
  fastify.get('/:dealId/kpis/summary', { preHandler: authPreHandler }, async (request, reply) => {
    return kpisController.getDealKpiSummary(request as any, reply);
  });

  // Get deal's KPI summary with all dimensions (actual/forecast/budget) and variances
  fastify.get('/:dealId/kpis/summary-with-dimensions', { preHandler: authPreHandler }, async (request, reply) => {
    return kpisController.getDealKpiSummaryWithDimensions(request as any, reply);
  });

  // Get deal's KPI outliers (exceptions dashboard)
  fastify.get('/:dealId/kpis/outliers', { preHandler: authPreHandler }, async (request, reply) => {
    return kpisController.getDealOutliers(request as any, reply);
  });

  // Get deal's KPIs by category
  fastify.get('/:dealId/kpis/category/:category', { preHandler: authPreHandler }, async (request, reply) => {
    return kpisController.getDealKpisByCategory(request as any, reply);
  });

  // Get KPI time series for charts
  fastify.get('/:dealId/kpis/:kpiId/timeseries', { preHandler: authPreHandler }, async (request, reply) => {
    return kpisController.getKpiTimeSeries(request as any, reply);
  });

  // Save single KPI data point (managers only)
  fastify.post('/:dealId/kpis', { preHandler: managerPreHandler }, async (request, reply) => {
    return kpisController.saveKpiData(request as any, reply);
  });

  // Bulk save KPI data (managers only)
  fastify.post('/:dealId/kpis/bulk', { preHandler: managerPreHandler }, async (request, reply) => {
    return kpisController.bulkSaveKpiData(request as any, reply);
  });

  // Delete KPI data point (managers only)
  fastify.delete('/:dealId/kpis/:dataId', { preHandler: managerPreHandler }, async (request, reply) => {
    return kpisController.deleteKpiData(request as any, reply);
  });

  // ========== Financial Statements ==========

  // Get deal's financial statements
  fastify.get('/:dealId/financials', { preHandler: authPreHandler }, async (request, reply) => {
    return kpisController.getFinancialStatements(request as any, reply);
  });

  // Get latest statement of specific type
  fastify.get('/:dealId/financials/:type', { preHandler: authPreHandler }, async (request, reply) => {
    return kpisController.getLatestFinancialStatement(request as any, reply);
  });

  // Save financial statement (managers only)
  fastify.post('/:dealId/financials', { preHandler: managerPreHandler }, async (request, reply) => {
    return kpisController.saveFinancialStatement(request as any, reply);
  });
}

