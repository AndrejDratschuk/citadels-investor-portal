/**
 * Google Sheets Routes
 * Route definitions for Google Sheets OAuth and data operations
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { googleSheetsController } from './googlesheets.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

export async function googleSheetsRoutes(fastify: FastifyInstance): Promise<void> {
  // ============================================
  // OAuth Routes
  // ============================================

  // Start OAuth flow (requires authentication)
  fastify.get(
    '/connect',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return googleSheetsController.connect(request as any, reply);
    }
  );

  // OAuth callback (no authentication - Google redirects here)
  fastify.get('/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    return googleSheetsController.callback(request as any, reply);
  });

  // ============================================
  // Spreadsheet/Sheet Routes (requires auth)
  // ============================================

  // List user's spreadsheets
  fastify.get(
    '/spreadsheets',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return googleSheetsController.listSpreadsheets(request as any, reply);
    }
  );

  // Get sheets in a spreadsheet
  fastify.get(
    '/spreadsheets/:spreadsheetId/sheets',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return googleSheetsController.getSheets(request as any, reply);
    }
  );

  // Preview sheet data
  fastify.get(
    '/preview/:spreadsheetId/:sheetName',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return googleSheetsController.previewData(request as any, reply);
    }
  );

  // ============================================
  // Routes using existing credentials (no re-auth needed)
  // ============================================

  // List spreadsheets using existing credentials
  fastify.get(
    '/existing/spreadsheets',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return googleSheetsController.listSpreadsheetsWithCredentials(request as any, reply);
    }
  );

  // Get sheets using existing credentials
  fastify.get(
    '/existing/spreadsheets/:spreadsheetId/sheets',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return googleSheetsController.getSheetsWithCredentials(request as any, reply);
    }
  );

  // Preview sheet data using existing credentials
  fastify.get(
    '/existing/preview/:spreadsheetId/:sheetName',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return googleSheetsController.previewDataWithCredentials(request as any, reply);
    }
  );

  // Save connection using existing credentials
  fastify.post(
    '/existing/connections',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return googleSheetsController.saveConnectionWithCredentials(request as any, reply);
    }
  );

  // ============================================
  // Connection Management Routes (requires auth)
  // ============================================

  // Save new connection after wizard (with connection_data from OAuth)
  fastify.post(
    '/connections',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return googleSheetsController.saveConnection(request as any, reply);
    }
  );

  // Get status of Google Sheets connections
  fastify.get(
    '/status',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return googleSheetsController.getStatus(request as any, reply);
    }
  );

  // Update sync settings
  fastify.patch(
    '/connections/:connectionId/sync-settings',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return googleSheetsController.updateSyncSettings(request as any, reply);
    }
  );

  // Manually trigger sync
  fastify.post(
    '/connections/:connectionId/sync',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return googleSheetsController.syncNow(request as any, reply);
    }
  );

  // Disconnect/delete a connection
  fastify.delete(
    '/connections/:connectionId',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return googleSheetsController.disconnect(request as any, reply);
    }
  );
}
