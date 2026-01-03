/**
 * KPI Controller (Orchestrator Layer)
 * Handles HTTP requests and responses for KPI endpoints
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { kpisService } from './kpis.service';
import { outliersService } from './outliers.service';
import {
  kpiDataWriteSchema,
  kpiDataBulkWriteSchema,
  kpiPreferencesUpdateSchema,
  financialStatementWriteSchema,
  kpiDataQuerySchema,
  outlierConfigUpdateSchema,
  KPI_CATEGORIES,
  KPI_DATA_TYPES,
  STATEMENT_TYPES,
} from '@altsui/shared';
import type { KpiCategory, KpiDataType, StatementType } from '@altsui/shared';

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

interface DealParams {
  dealId: string;
}

interface KpiParams {
  kpiId: string;
}

interface CategoryParams {
  category: string;
}

interface KpiDataIdParams extends DealParams {
  dataId: string;
}

interface StatementTypeParams extends DealParams {
  type: string;
}

// ============================================
// Controller Class
// ============================================
export class KpisController {
  // ========== KPI Definitions ==========

  async getAllDefinitions(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const definitions = await kpisService.getAllDefinitions();

      reply.send({
        success: true,
        data: definitions,
      });
    } catch (error) {
      console.error('Error getting KPI definitions:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch KPI definitions',
      });
    }
  }

  async getDefinitionsByCategory(
    request: AuthenticatedRequest & { params: CategoryParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { category } = request.params;

      if (!KPI_CATEGORIES.includes(category as KpiCategory)) {
        reply.status(400).send({
          success: false,
          error: `Invalid category. Must be one of: ${KPI_CATEGORIES.join(', ')}`,
        });
        return;
      }

      const definitions = await kpisService.getDefinitionsByCategory(category as KpiCategory);

      reply.send({
        success: true,
        data: definitions,
      });
    } catch (error) {
      console.error('Error getting KPI definitions by category:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch KPI definitions',
      });
    }
  }

  async getDefinitionsWithPreferences(
    request: AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { fundId } = request.user;
      const definitions = await kpisService.getDefinitionsWithPreferences(fundId);

      reply.send({
        success: true,
        data: definitions,
      });
    } catch (error) {
      console.error('Error getting KPI definitions with preferences:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch KPI definitions',
      });
    }
  }

  // ========== KPI Preferences ==========

  async getPreferences(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const { fundId } = request.user;
      const preferences = await kpisService.getPreferences(fundId);

      reply.send({
        success: true,
        data: preferences,
      });
    } catch (error) {
      console.error('Error getting KPI preferences:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch KPI preferences',
      });
    }
  }

  async updatePreferences(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const { fundId } = request.user;
      const validation = kpiPreferencesUpdateSchema.safeParse(request.body);

      if (!validation.success) {
        reply.status(400).send({
          success: false,
          error: 'Invalid request body',
          details: validation.error.issues,
        });
        return;
      }

      const preferences = await kpisService.updatePreferences(fundId, validation.data.preferences);

      reply.send({
        success: true,
        data: preferences,
      });
    } catch (error) {
      console.error('Error updating KPI preferences:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to update KPI preferences',
      });
    }
  }

  // ========== Deal KPI Data ==========

  async getDealKpis(
    request: AuthenticatedRequest & { params: DealParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { dealId } = request.params;
      const queryValidation = kpiDataQuerySchema.safeParse(request.query);

      const options = queryValidation.success ? queryValidation.data : {};

      const kpiData = await kpisService.getDealKpiData(dealId, {
        category: options.category as KpiCategory | undefined,
        dataType: options.dataType as KpiDataType | undefined,
        periodType: options.periodType,
        startDate: options.startDate,
        endDate: options.endDate,
      });

      reply.send({
        success: true,
        data: kpiData,
      });
    } catch (error) {
      console.error('Error getting deal KPIs:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch KPI data',
      });
    }
  }

  async getDealKpiSummary(
    request: AuthenticatedRequest & { params: DealParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { dealId } = request.params;
      const { fundId } = request.user;

      // Get deal name (you'd typically get this from the deals service)
      const dealName = (request.query as { dealName?: string }).dealName || 'Deal';

      const summary = await kpisService.getDealKpiSummary(dealId, fundId, dealName);

      reply.send({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error('Error getting deal KPI summary:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch KPI summary',
      });
    }
  }

  async getDealKpisByCategory(
    request: AuthenticatedRequest & { params: DealParams & CategoryParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { dealId, category } = request.params;

      if (!KPI_CATEGORIES.includes(category as KpiCategory)) {
        reply.status(400).send({
          success: false,
          error: `Invalid category. Must be one of: ${KPI_CATEGORIES.join(', ')}`,
        });
        return;
      }

      const queryValidation = kpiDataQuerySchema.safeParse(request.query);
      const options = queryValidation.success ? queryValidation.data : {};

      const kpiData = await kpisService.getDealKpiData(dealId, {
        category: category as KpiCategory,
        dataType: options.dataType as KpiDataType | undefined,
        periodType: options.periodType,
        startDate: options.startDate,
        endDate: options.endDate,
      });

      reply.send({
        success: true,
        data: kpiData,
      });
    } catch (error) {
      console.error('Error getting deal KPIs by category:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch KPI data',
      });
    }
  }

  async saveKpiData(
    request: AuthenticatedRequest & { params: DealParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { dealId } = request.params;
      const { id: userId } = request.user;

      const validation = kpiDataWriteSchema.safeParse(request.body);

      if (!validation.success) {
        reply.status(400).send({
          success: false,
          error: 'Invalid request body',
          details: validation.error.issues,
        });
        return;
      }

      const kpiData = await kpisService.saveKpiData(dealId, validation.data, userId);

      reply.send({
        success: true,
        data: kpiData,
      });
    } catch (error) {
      console.error('Error saving KPI data:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to save KPI data',
      });
    }
  }

  async bulkSaveKpiData(
    request: AuthenticatedRequest & { params: DealParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { dealId } = request.params;
      const { id: userId } = request.user;

      const validation = kpiDataBulkWriteSchema.safeParse(request.body);

      if (!validation.success) {
        reply.status(400).send({
          success: false,
          error: 'Invalid request body',
          details: validation.error.issues,
        });
        return;
      }

      const kpiData = await kpisService.bulkSaveKpiData(dealId, validation.data.data, userId);

      reply.send({
        success: true,
        data: kpiData,
      });
    } catch (error) {
      console.error('Error bulk saving KPI data:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to save KPI data',
      });
    }
  }

  async deleteKpiData(
    request: AuthenticatedRequest & { params: KpiDataIdParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { dealId, dataId } = request.params;

      await kpisService.deleteKpiData(dealId, dataId);

      reply.send({
        success: true,
        message: 'KPI data deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting KPI data:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to delete KPI data',
      });
    }
  }

  // ========== KPI Time Series ==========

  async getKpiTimeSeries(
    request: AuthenticatedRequest & { params: DealParams & KpiParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { dealId, kpiId } = request.params;
      const query = request.query as {
        periodType?: string;
        startDate?: string;
        endDate?: string;
      };

      const timeSeries = await kpisService.getKpiTimeSeries(dealId, kpiId, {
        periodType: query.periodType as any,
        startDate: query.startDate,
        endDate: query.endDate,
      });

      if (!timeSeries) {
        reply.status(404).send({
          success: false,
          error: 'KPI not found',
        });
        return;
      }

      reply.send({
        success: true,
        data: timeSeries,
      });
    } catch (error) {
      console.error('Error getting KPI time series:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch KPI time series',
      });
    }
  }

  // ========== Financial Statements ==========

  async getFinancialStatements(
    request: AuthenticatedRequest & { params: DealParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { dealId } = request.params;
      const { type } = request.query as { type?: string };

      let statementType: StatementType | undefined;
      if (type) {
        if (!STATEMENT_TYPES.includes(type as StatementType)) {
          reply.status(400).send({
            success: false,
            error: `Invalid statement type. Must be one of: ${STATEMENT_TYPES.join(', ')}`,
          });
          return;
        }
        statementType = type as StatementType;
      }

      const statements = await kpisService.getFinancialStatements(dealId, statementType);

      reply.send({
        success: true,
        data: statements,
      });
    } catch (error) {
      console.error('Error getting financial statements:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch financial statements',
      });
    }
  }

  async getLatestFinancialStatement(
    request: AuthenticatedRequest & { params: StatementTypeParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { dealId, type } = request.params;

      if (!STATEMENT_TYPES.includes(type as StatementType)) {
        reply.status(400).send({
          success: false,
          error: `Invalid statement type. Must be one of: ${STATEMENT_TYPES.join(', ')}`,
        });
        return;
      }

      const statement = await kpisService.getLatestFinancialStatement(dealId, type as StatementType);

      if (!statement) {
        reply.status(404).send({
          success: false,
          error: 'Financial statement not found',
        });
        return;
      }

      reply.send({
        success: true,
        data: statement,
      });
    } catch (error) {
      console.error('Error getting latest financial statement:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch financial statement',
      });
    }
  }

  async saveFinancialStatement(
    request: AuthenticatedRequest & { params: DealParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { dealId } = request.params;
      const { id: userId } = request.user;

      const validation = financialStatementWriteSchema.safeParse(request.body);

      if (!validation.success) {
        reply.status(400).send({
          success: false,
          error: 'Invalid request body',
          details: validation.error.issues,
        });
        return;
      }

      const statement = await kpisService.saveFinancialStatement(
        dealId,
        validation.data,
        userId
      );

      reply.send({
        success: true,
        data: statement,
      });
    } catch (error) {
      console.error('Error saving financial statement:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to save financial statement',
      });
    }
  }

  // ========== KPI Outliers ==========

  async getDealOutliers(
    request: AuthenticatedRequest & { params: DealParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { dealId } = request.params;
      const { fundId } = request.user;
      const query = request.query as { 
        periodDate?: string; 
        topCount?: string;
        startDate?: string;
        endDate?: string;
      };

      // Use current date if not specified
      const periodDate = query.periodDate || new Date().toISOString().split('T')[0];
      const topCount = query.topCount ? parseInt(query.topCount, 10) : 5;

      const outliers = await outliersService.getOutliers(
        dealId,
        fundId,
        periodDate,
        topCount,
        query.startDate,
        query.endDate
      );

      reply.send({
        success: true,
        data: outliers,
      });
    } catch (error) {
      console.error('Error getting deal outliers:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch KPI outliers',
      });
    }
  }

  async getOutlierConfig(
    request: AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { fundId } = request.user;
      const configs = await outliersService.getConfig(fundId);

      reply.send({
        success: true,
        data: configs,
      });
    } catch (error) {
      console.error('Error getting outlier config:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch outlier configuration',
      });
    }
  }

  async updateOutlierConfig(
    request: AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { fundId } = request.user;
      const validation = outlierConfigUpdateSchema.safeParse(request.body);

      if (!validation.success) {
        reply.status(400).send({
          success: false,
          error: 'Invalid request body',
          details: validation.error.issues,
        });
        return;
      }

      const configs = await outliersService.updateConfig(fundId, validation.data.configs);

      reply.send({
        success: true,
        data: configs,
      });
    } catch (error) {
      console.error('Error updating outlier config:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to update outlier configuration',
      });
    }
  }
}

export const kpisController = new KpisController();

