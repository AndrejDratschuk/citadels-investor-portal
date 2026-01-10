/**
 * Data Import Controller
 * Handles HTTP requests for data import operations
 * Boundary validation with Zod at entry points
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { dataImportService } from './data-import.service';
import {
  googleSheetsConnectSchema,
  columnMappingUpdateSchema,
  importRequestSchema,
  suggestMappingsRequestSchema,
  sampleDataImportSchema,
} from '@altsui/shared';
import { kpisRepository } from '../kpis/kpis.repository';
import { suggestColumnMappings } from '@altsui/shared';
import { dealsService } from '../deals/deals.service';

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
          details: validation.error.flatten(),
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
          details: validation.error.flatten(),
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

  async updateConnectionDeal(
    request: AuthenticatedRequest & { params: ConnectionIdParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { connectionId } = request.params;
      const { dealId } = request.body as { dealId: string | null };

      // Validate dealId is a valid UUID or null
      if (dealId !== null && typeof dealId !== 'string') {
        reply.status(400).send({
          success: false,
          error: 'dealId must be a string UUID or null',
        });
        return;
      }

      const connection = await dataImportService.updateConnectionDeal(connectionId, dealId);

      reply.send({
        success: true,
        data: connection,
      });
    } catch (error) {
      console.error('Error updating connection deal:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to update connection deal',
      });
    }
  }

  async getConnectionsByDeal(
    request: AuthenticatedRequest & { params: DealIdParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { dealId } = request.params;
      const connections = await dataImportService.getConnectionsByDeal(dealId);

      reply.send({
        success: true,
        data: connections,
      });
    } catch (error) {
      console.error('Error getting connections by deal:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch data connections',
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

      const result = await dataImportService.syncGoogleSheets(
        connectionId,
        dealId,
        userId,
        { now: new Date(), generateId: () => crypto.randomUUID() }
      );

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

      const result = await dataImportService.importExcel(
        dealId,
        connectionId,
        data,
        userId,
        { now: new Date(), generateId: () => crypto.randomUUID() }
      );

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

  // ========== Onboarding Endpoints ==========

  /**
   * Suggest column mappings based on column names
   * Uses pure function from shared package
   */
  async suggestMappings(
    request: AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      // Validate at boundary
      const validation = suggestMappingsRequestSchema.safeParse(request.body);
      if (!validation.success) {
        reply.status(400).send({
          success: false,
          error: 'Invalid request body',
          details: validation.error.flatten(),
        });
        return;
      }

      // Get KPI definitions
      const definitions = await kpisRepository.getAllDefinitions();

      // Call pure function for suggestions
      const suggestions = suggestColumnMappings(
        validation.data.columnNames,
        definitions,
        validation.data.sampleValues
      );

      reply.send({
        success: true,
        data: {
          suggestions,
          definitions: definitions.map(d => ({
            id: d.id,
            code: d.code,
            name: d.name,
            category: d.category,
            format: d.format,
          })),
        },
      });
    } catch (error) {
      console.error('Error suggesting mappings:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to suggest column mappings',
      });
    }
  }

  /**
   * Import data with full validation
   * Main endpoint for onboarding flow
   */
  async importWithMapping(
    request: AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      // Validate at boundary
      const validation = importRequestSchema.safeParse(request.body);
      if (!validation.success) {
        reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: validation.error.flatten(),
        });
        return;
      }

      const { id: userId, fundId } = request.user;

      // Get or create a deal for import
      let dealId = validation.data.dealId;
      if (!dealId) {
        // Try to find existing deals for this fund
        const existingDeals = await dealsService.getAllByFundId(fundId);
        
        if (existingDeals.length > 0) {
          // Use the first deal
          dealId = existingDeals[0].id;
        } else {
          // Create a default deal for data import
          const newDeal = await dealsService.create(fundId, {
            name: 'General Portfolio',
            description: 'Default property for fund-level KPI data',
            status: 'acquired',
            propertyType: 'multifamily',
          });
          dealId = newDeal.id;
        }
      }

      // Inject dependencies (strict determinism)
      const result = await dataImportService.createConnectionAndImport(
        {
          fundId,
          dealId,
          connectionName: validation.data.connectionName,
          mappings: validation.data.mappings,
          data: validation.data.data,
          userId,
        },
        { now: new Date(), generateId: () => crypto.randomUUID() }
      );

      reply.send({
        success: result.success,
        data: result,
      });
    } catch (error) {
      console.error('Error importing data:', error);
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import data',
      });
    }
  }

  /**
   * Import sample data for exploration
   */
  async importSampleData(
    request: AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      // Validate at boundary (more lenient - just needs valid body structure)
      const validation = sampleDataImportSchema.safeParse(request.body);
      if (!validation.success) {
        reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: validation.error.flatten(),
        });
        return;
      }

      const { id: userId, fundId } = request.user;

      // Get or create a deal for sample data import
      let dealId = validation.data.dealId;
      if (!dealId) {
        // Try to find existing deals for this fund
        const existingDeals = await dealsService.getAllByFundId(fundId);
        
        if (existingDeals.length > 0) {
          // Use the first deal
          dealId = existingDeals[0].id;
        } else {
          // Create a default deal for sample data
          const newDeal = await dealsService.create(fundId, {
            name: 'Oakwood Apartments (Sample)',
            description: 'Sample property with demo data for exploration',
            status: 'acquired',
            propertyType: 'multifamily',
            unitCount: 200,
            squareFootage: 180000,
          });
          dealId = newDeal.id;
        }
      }

      // Inject dependencies
      const result = await dataImportService.importSampleData(
        {
          fundId,
          dealId,
          userId,
        },
        { now: new Date(), generateId: () => crypto.randomUUID() }
      );

      reply.send({
        success: result.success,
        data: result,
      });
    } catch (error) {
      console.error('Error importing sample data:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to import sample data',
      });
    }
  }

  /**
   * Get sample data for preview
   */
  async getSampleData(
    request: AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const sampleData = dataImportService.getSampleData();

      reply.send({
        success: true,
        data: sampleData,
      });
    } catch (error) {
      console.error('Error getting sample data:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get sample data',
      });
    }
  }

  /**
   * Get KPI definitions for mapping dropdown
   */
  async getKpiDefinitions(
    request: AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const definitions = await kpisRepository.getAllDefinitions();

      reply.send({
        success: true,
        data: definitions.map(d => ({
          id: d.id,
          code: d.code,
          name: d.name,
          category: d.category,
          format: d.format,
          description: d.description,
        })),
      });
    } catch (error) {
      console.error('Error getting KPI definitions:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get KPI definitions',
      });
    }
  }
}

export const dataImportController = new DataImportController();
