/**
 * Outliers Service (Orchestrator Layer)
 * Coordinates between repository and pure calculation functions
 * Handles errors with try/catch
 */

import { outliersRepository } from './outliers.repository';
import { kpisRepository } from './kpis.repository';
import {
  identifyOutliers,
  extractBaselineValue,
  groupKpiDataByKpiAndType,
} from './calculateOutlierVariance';
import type {
  OutliersResponse,
  KpiOutlierConfig,
  OutlierComparisonBaseline,
  KpiDefinition,
  DEFAULT_INVERSE_METRIC_CODES,
} from '@altsui/shared';

// Import the constant directly since it's a value not a type
import { DEFAULT_INVERSE_METRIC_CODES as INVERSE_CODES } from '@altsui/shared';

// ============================================
// Service Class
// ============================================
export class OutliersService {
  /**
   * Get outliers for a deal, comparing actual values against selected baseline
   */
  async getOutliers(
    dealId: string,
    fundId: string,
    periodDate: string,
    topCount: number = 5,
    startDate?: string,
    endDate?: string
  ): Promise<OutliersResponse> {
    try {
      // Build date filter options
      const dateFilter = startDate && endDate 
        ? { startDate, endDate } 
        : undefined;

      // Fetch all required data in parallel
      const [configs, definitions, kpiData] = await Promise.all([
        outliersRepository.getConfigsByFundId(fundId),
        kpisRepository.getAllDefinitions(),
        kpisRepository.getKpiDataByDeal(dealId, dateFilter),
      ]);

      // Build config lookup map
      const configsByKpiId = new Map(configs.map(c => [c.kpiId, c]));
      const defsById = new Map(definitions.map(d => [d.id, d]));

      // Group KPI data by KPI ID and type
      const groupedData = groupKpiDataByKpiAndType(kpiData);

      // Build KPIs with their baseline values
      const kpisWithBaselines = this.buildKpisWithBaselines(
        groupedData,
        defsById,
        configsByKpiId
      );

      // Call pure function to identify outliers
      const result = identifyOutliers({
        kpisWithBaselines,
        configsByKpiId,
        defaultInverseKpiCodes: INVERSE_CODES,
      });

      return {
        dealId,
        topPerformers: result.topPerformers.slice(0, topCount),
        bottomPerformers: result.bottomPerformers.slice(0, topCount),
        lastUpdated: new Date().toISOString(),
        comparisonPeriod: periodDate,
      };
    } catch (error) {
      console.error('Failed to calculate outliers:', error);
      throw error;
    }
  }

  /**
   * Get outlier configuration for a fund
   */
  async getConfig(fundId: string): Promise<KpiOutlierConfig[]> {
    try {
      return await outliersRepository.getConfigsByFundId(fundId);
    } catch (error) {
      console.error('Failed to get outlier config:', error);
      throw error;
    }
  }

  /**
   * Update outlier configuration for specific KPIs
   */
  async updateConfig(
    fundId: string,
    configs: Array<{
      kpiId: string;
      alertThreshold?: number;
      comparisonBaseline?: OutlierComparisonBaseline;
      greenThreshold?: number;
      redThreshold?: number;
      isInverseMetric?: boolean;
      enabledInOutliers?: boolean;
    }>
  ): Promise<KpiOutlierConfig[]> {
    try {
      return await outliersRepository.bulkUpsertConfigs(fundId, configs);
    } catch (error) {
      console.error('Failed to update outlier config:', error);
      throw error;
    }
  }

  // ============================================
  // Private Helpers
  // ============================================

  /**
   * Build array of KPIs with their baseline values for comparison
   */
  private buildKpisWithBaselines(
    groupedData: Map<string, {
      actual: { value: number; periodDate: string } | null;
      forecast: { value: number } | null;
      budget: { value: number } | null;
      lastPeriod: { value: number } | null;
    }>,
    defsById: Map<string, KpiDefinition>,
    configsByKpiId: Map<string, KpiOutlierConfig>
  ): Array<{
    definition: KpiDefinition;
    actualValue: number;
    baselineValue: number;
    baselineType: OutlierComparisonBaseline;
  }> {
    const result: Array<{
      definition: KpiDefinition;
      actualValue: number;
      baselineValue: number;
      baselineType: OutlierComparisonBaseline;
    }> = [];

    for (const [kpiId, dataByType] of groupedData) {
      const definition = defsById.get(kpiId);
      if (!definition) continue;

      // Skip if no actual value
      if (!dataByType.actual) continue;

      // Determine which baseline to use
      const config = configsByKpiId.get(kpiId);
      const baselineType: OutlierComparisonBaseline = 
        config?.comparisonBaseline ?? 'forecast';

      // Extract baseline value
      const baselineValue = extractBaselineValue(dataByType, baselineType);
      if (baselineValue === null) continue;

      result.push({
        definition,
        actualValue: dataByType.actual.value,
        baselineValue,
        baselineType,
      });
    }

    return result;
  }
}

export const outliersService = new OutliersService();

