/**
 * Data Import Routes
 * Route definitions for data import endpoints
 */

import { FastifyInstance } from 'fastify';
import { dataImportController } from './data-import.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireManager } from '../../common/middleware/rbac.middleware';

export async function dataImportRoutes(fastify: FastifyInstance): Promise<void> {
  const managerPreHandler = [authenticate, requireManager];

  // ========== Onboarding Endpoints ==========

  // Get KPI definitions for mapping dropdown
  fastify.get('/kpi-definitions', { preHandler: managerPreHandler }, async (request, reply) => {
    return dataImportController.getKpiDefinitions(request as any, reply);
  });

  // Suggest column mappings based on column names
  fastify.post('/suggest-mappings', { preHandler: managerPreHandler }, async (request, reply) => {
    return dataImportController.suggestMappings(request as any, reply);
  });

  // Import data with mapping (main onboarding import)
  fastify.post('/import', { preHandler: managerPreHandler }, async (request, reply) => {
    return dataImportController.importWithMapping(request as any, reply);
  });

  // Get sample data for preview
  fastify.get('/sample-data', { preHandler: managerPreHandler }, async (request, reply) => {
    return dataImportController.getSampleData(request as any, reply);
  });

  // Import sample data
  fastify.post('/import-sample', { preHandler: managerPreHandler }, async (request, reply) => {
    return dataImportController.importSampleData(request as any, reply);
  });

  // ========== Data Connections ==========

  // Get all connections for fund
  fastify.get('/connections', { preHandler: managerPreHandler }, async (request, reply) => {
    return dataImportController.getConnections(request as any, reply);
  });

  // Create Google Sheets connection
  fastify.post('/connections/google', { preHandler: managerPreHandler }, async (request, reply) => {
    return dataImportController.createGoogleSheetsConnection(request as any, reply);
  });

  // Create Excel connection
  fastify.post('/connections/excel', { preHandler: managerPreHandler }, async (request, reply) => {
    return dataImportController.createExcelConnection(request as any, reply);
  });

  // Update column mapping
  fastify.put(
    '/connections/:connectionId/mapping',
    { preHandler: managerPreHandler },
    async (request, reply) => {
      return dataImportController.updateColumnMapping(request as any, reply);
    }
  );

  // Delete connection
  fastify.delete(
    '/connections/:connectionId',
    { preHandler: managerPreHandler },
    async (request, reply) => {
      return dataImportController.deleteConnection(request as any, reply);
    }
  );

  // Update connection's deal
  fastify.patch(
    '/connections/:connectionId/deal',
    { preHandler: managerPreHandler },
    async (request, reply) => {
      return dataImportController.updateConnectionDeal(request as any, reply);
    }
  );

  // Get connections by deal
  fastify.get('/connections/deal/:dealId', { preHandler: managerPreHandler }, async (request, reply) => {
    return dataImportController.getConnectionsByDeal(request as any, reply);
  });

  // ========== Sync Operations ==========

  // Sync Google Sheets data for a deal
  fastify.post(
    '/sync/:connectionId/deal/:dealId',
    { preHandler: managerPreHandler },
    async (request, reply) => {
      return dataImportController.syncGoogleSheets(request as any, reply);
    }
  );

  // Import Excel data for a deal
  fastify.post(
    '/excel/:connectionId/deal/:dealId',
    { preHandler: managerPreHandler },
    async (request, reply) => {
      return dataImportController.importExcel(request as any, reply);
    }
  );

  // Preview mapped data
  fastify.post(
    '/preview/:connectionId',
    { preHandler: managerPreHandler },
    async (request, reply) => {
      return dataImportController.previewMappedData(request as any, reply);
    }
  );
}
