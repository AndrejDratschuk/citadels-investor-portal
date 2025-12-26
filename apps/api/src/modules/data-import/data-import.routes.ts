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

