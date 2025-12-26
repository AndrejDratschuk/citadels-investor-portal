/**
 * Data Import Controller
 * Handles HTTP requests for data import operations
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { dataImportService } from './data-import.service';
import {
  googleSheetsConnectSchema,
  columnMappingUpdateSchema,
  excelImportSchema,
} from '@flowveda/shared';

// ============================================
// Request Types
// ============================================
interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    fundId: string;
    role: string;
  };
}

interface ConnectionIdParams {
  connectionId: string;
}

interface DealIdParams {
  dealId: string;
}

// ============================================
// Controller Class
// ============================================
export class DataImportController {
  // ========== Connections ==========

  async getConnections(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const { fundId } = request.user;
      const connections = await dataImportService.getConnections(fundId);

      reply.send({
        success: true,
        data: connections,
      });
    } catch (error) {
      console.error('Error getting connections:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch data connections',
      });
    }
  }

  async createGoogleSheetsConnection(
    request: AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { fundId } = request.user;
      const validation = googleSheetsConnectSchema.safeParse(request.body);

      if (!validation.success) {
        reply.status(400).send({
          success: false,
          error: 'Invalid request body',
          details: validation.error.issues,
        });
        return;
      }

      const connection = await dataImportService.createGoogleSheetsConnection({
        fundId,
        ...validation.data,
      });

      reply.send({
        success: true,
        data: connection,
      });
    } catch (error) {
      console.error('Error creating Google Sheets connection:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to create connection',
      });
    }
  }

  async createExcelConnection(
    request: AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { fundId } = request.user;
      const { name } = request.body as { name: string };

      if (!name) {
        reply.status(400).send({
          success: false,
          error: 'Name is required',
        });
        return;
      }

      const connection = await dataImportService.createExcelConnection({
        fundId,
        name,
      });

      reply.send({
        success: true,
        data: connection,
      });
    } catch (error) {
      console.error('Error creating Excel connection:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to create connection',
      });
    }
  }

  async updateColumnMapping(
    request: AuthenticatedRequest & { params: ConnectionIdParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { connectionId } = request.params;
      const validation = columnMappingUpdateSchema.safeParse(request.body);

      if (!validation.success) {
        reply.status(400).send({
          success: false,
          error: 'Invalid request body',
          details: validation.error.issues,
        });
        return;
      }

      const connection = await dataImportService.updateColumnMapping(
        connectionId,
        validation.data.mappings
      );

      reply.send({
        success: true,
        data: connection,
      });
    } catch (error) {
      console.error('Error updating column mapping:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to update column mapping',
      });
    }
  }

  async deleteConnection(
    request: AuthenticatedRequest & { params: ConnectionIdParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { connectionId } = request.params;
      await dataImportService.deleteConnection(connectionId);

      reply.send({
        success: true,
        message: 'Connection deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting connection:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to delete connection',
      });
    }
  }

  // ========== Sync Operations ==========

  async syncGoogleSheets(
    request: AuthenticatedRequest & { params: ConnectionIdParams & DealIdParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { connectionId, dealId } = request.params;
      const { id: userId } = request.user;

      const result = await dataImportService.syncGoogleSheets(connectionId, dealId, userId);

      reply.send({
        success: result.success,
        data: {
          rowsImported: result.rowsImported,
          errors: result.errors,
        },
      });
    } catch (error) {
      console.error('Error syncing Google Sheets:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to sync data',
      });
    }
  }

  async importExcel(
    request: AuthenticatedRequest & { params: ConnectionIdParams & DealIdParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { connectionId, dealId } = request.params;
      const { id: userId } = request.user;
      const { data } = request.body as { data: Array<Record<string, unknown>> };

      if (!Array.isArray(data)) {
        reply.status(400).send({
          success: false,
          error: 'Data must be an array',
        });
        return;
      }

      const result = await dataImportService.importExcel(dealId, connectionId, data, userId);

      reply.send({
        success: result.success,
        data: {
          rowsImported: result.rowsImported,
          errors: result.errors,
        },
      });
    } catch (error) {
      console.error('Error importing Excel data:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to import data',
      });
    }
  }

  async previewMappedData(
    request: AuthenticatedRequest & { params: ConnectionIdParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { connectionId } = request.params;
      const { sampleData } = request.body as { sampleData: Array<Record<string, unknown>> };

      if (!Array.isArray(sampleData)) {
        reply.status(400).send({
          success: false,
          error: 'Sample data must be an array',
        });
        return;
      }

      const preview = await dataImportService.previewMappedData(connectionId, sampleData);

      reply.send({
        success: true,
        data: preview,
      });
    } catch (error) {
      console.error('Error previewing mapped data:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to preview data',
      });
    }
  }
}

export const dataImportController = new DataImportController();

