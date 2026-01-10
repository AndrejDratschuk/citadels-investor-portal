/**
 * KPI Service (Orchestrator Layer)
 * Coordinates business logic between controllers and repository
 */

import { kpisRepository } from './kpis.repository';
import {
  calculateChangePercent,
  formatCurrency,
  formatPercentage,
} from '@altsui/shared';
import type {
  KpiDefinition,
  KpiPreference,
  KpiDataPoint,
  KpiCategory,
  KpiDataType,
  KpiPeriodType,
  KpiCardData,
  KpiTimeSeries,
  KpiTimeSeriesPoint,
  DealKpiSummary,
  FinancialStatement,
  StatementType,
  KpiDefinitionWithPreference,
} from '@altsui/shared';

// ============================================
// Service Class
// ============================================
export class KpisService {
  // ========== KPI Definitions ==========

  async getAllDefinitions(): Promise<KpiDefinition[]> {
    return kpisRepository.getAllDefinitions();
  }

  async getDefinitionsByCategory(category: KpiCategory): Promise<KpiDefinition[]> {
    return kpisRepository.getDefinitionsByCategory(category);
  }

  async getDefinitionsWithPreferences(fundId: string): Promise<KpiDefinitionWithPreference[]> {
    const [definitions, preferences] = await Promise.all([
      kpisRepository.getAllDefinitions(),
      kpisRepository.getPreferencesByFundId(fundId),
    ]);

    const prefsMap = new Map(preferences.map(p => [p.kpiId, p]));

    return definitions.map(def => ({
      ...def,
      preference: prefsMap.get(def.id) || null,
    }));
  }

  // ========== KPI Preferences ==========

  async getPreferences(fundId: string): Promise<KpiPreference[]> {
    return kpisRepository.getPreferencesByFundId(fundId);
  }

  async getFeaturedKpis(fundId: string): Promise<KpiDefinition[]> {
    const preferences = await kpisRepository.getFeaturedPreferences(fundId);
    
    if (preferences.length === 0) {
      // Return default featured KPIs if none configured
      return this.getDefaultFeaturedKpis();
    }

    const definitions = await kpisRepository.getAllDefinitions();
    const defsMap = new Map(definitions.map(d => [d.id, d]));

    return preferences
      .map(p => defsMap.get(p.kpiId))
      .filter((d): d is KpiDefinition => d !== undefined);
  }

  async updatePreferences(
    fundId: string,
    updates: Array<{
      kpiId: string;
      isFeatured?: boolean;
      isEnabled?: boolean;
      sortOrder?: number;
    }>
  ): Promise<KpiPreference[]> {
    const results: KpiPreference[] = [];

    for (const update of updates) {
      const pref = await kpisRepository.upsertPreference(fundId, update.kpiId, {
        isFeatured: update.isFeatured,
        isEnabled: update.isEnabled,
        sortOrder: update.sortOrder,
      });
      results.push(pref);
    }

    return results;
  }

  private async getDefaultFeaturedKpis(): Promise<KpiDefinition[]> {
    const definitions = await kpisRepository.getAllDefinitions();
    // Default featured KPIs: NOI, Cap Rate, Occupancy, DSCR, GPR, EGI
    const defaultCodes = ['noi', 'cap_rate', 'physical_occupancy', 'dscr', 'gpr', 'egi'];
    return definitions.filter(d => defaultCodes.includes(d.code));
  }

  // ========== KPI Data ==========

  async getDealKpiData(
    dealId: string,
    options?: {
      category?: KpiCategory;
      dataType?: KpiDataType;
      periodType?: KpiPeriodType;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<KpiDataPoint[]> {
    return kpisRepository.getKpiDataByDeal(dealId, options);
  }

  async saveKpiData(
    dealId: string,
    data: {
      kpiId: string;
      periodType: KpiPeriodType;
      periodDate: string;
      dataType: KpiDataType;
      value: number;
      source?: string;
    },
    userId?: string
  ): Promise<KpiDataPoint> {
    return kpisRepository.upsertKpiData(dealId, data.kpiId, {
      ...data,
      createdBy: userId,
    });
  }

  async bulkSaveKpiData(
    dealId: string,
    dataPoints: Array<{
      kpiId: string;
      periodType: KpiPeriodType;
      periodDate: string;
      dataType: KpiDataType;
      value: number;
      source?: string;
    }>,
    userId?: string
  ): Promise<KpiDataPoint[]> {
    return kpisRepository.bulkUpsertKpiData(
      dealId,
      dataPoints.map(p => ({ ...p, createdBy: userId }))
    );
  }

  async deleteKpiData(dealId: string, kpiDataId: string): Promise<void> {
    return kpisRepository.deleteKpiData(dealId, kpiDataId);
  }

  // ========== KPI Summary (for display) ==========

  async getDealKpiSummary(
    dealId: string,
    fundId: string,
    dealName: string
  ): Promise<DealKpiSummary> {
    const [definitions, preferences, kpiData] = await Promise.all([
      kpisRepository.getAllDefinitions(),
      kpisRepository.getPreferencesByFundId(fundId),
      kpisRepository.getKpiDataByDeal(dealId, { dataType: 'actual' }),
    ]);

    const defsMap = new Map(definitions.map(d => [d.id, d]));
    const prefsMap = new Map(preferences.map(p => [p.kpiId, p]));

    // Get latest value for each KPI
    const latestByKpi = new Map<string, KpiDataPoint>();
    const previousByKpi = new Map<string, KpiDataPoint>();

    for (const point of kpiData) {
      const existing = latestByKpi.get(point.kpiId);
      if (!existing || point.periodDate > existing.periodDate) {
        if (existing) {
          previousByKpi.set(point.kpiId, existing);
        }
        latestByKpi.set(point.kpiId, point);
      } else if (!previousByKpi.has(point.kpiId) || point.periodDate > previousByKpi.get(point.kpiId)!.periodDate) {
        previousByKpi.set(point.kpiId, point);
      }
    }

    // Build card data for each KPI
    const buildCardData = (def: KpiDefinition): KpiCardData => {
      const latest = latestByKpi.get(def.id);
      const previous = previousByKpi.get(def.id);
      const value = latest?.value ?? null;
      const prevValue = previous?.value ?? null;
      const change = value !== null && prevValue !== null
        ? calculateChangePercent(value, prevValue)
        : null;

      return {
        id: def.id,
        code: def.code,
        name: def.name,
        value: this.formatKpiValue(value, def.format),
        rawValue: value,
        change,
        changeLabel: 'vs Last Period',
        format: def.format,
        category: def.category,
      };
    };

    // Featured KPIs
    const featuredPrefs = preferences.filter(p => p.isFeatured);
    const featuredDefs = featuredPrefs.length > 0
      ? featuredPrefs.map(p => defsMap.get(p.kpiId)).filter((d): d is KpiDefinition => !!d)
      : await this.getDefaultFeaturedKpis();

    const featured = featuredDefs.map(buildCardData);

    // Group by category
    const byCategory: Record<KpiCategory, KpiCardData[]> = {
      rent_revenue: [],
      occupancy: [],
      property_performance: [],
      financial: [],
      debt_service: [],
    };

    for (const def of definitions) {
      const pref = prefsMap.get(def.id);
      // Include if enabled or no preference set
      if (!pref || pref.isEnabled) {
        byCategory[def.category].push(buildCardData(def));
      }
    }

    // Find latest update timestamp
    const latestUpdate = kpiData.length > 0
      ? kpiData.reduce((max, p) => p.updatedAt > max ? p.updatedAt : max, kpiData[0].updatedAt)
      : null;

    return {
      dealId,
      dealName,
      featured,
      byCategory,
      lastUpdated: latestUpdate,
    };
  }

  // ========== KPI Time Series (for charts) ==========

  async getKpiTimeSeries(
    dealId: string,
    kpiId: string,
    options?: {
      periodType?: KpiPeriodType;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<KpiTimeSeries | null> {
    const definition = await kpisRepository.getDefinitionById(kpiId);
    if (!definition) {
      return null;
    }

    const kpiData = await kpisRepository.getKpiDataByDeal(dealId, {
      periodType: options?.periodType,
      startDate: options?.startDate,
      endDate: options?.endDate,
    });

    // Filter to just this KPI
    const relevantData = kpiData.filter(d => d.kpiId === kpiId);

    // Group by period date
    const byDate = new Map<string, KpiTimeSeriesPoint>();

    for (const point of relevantData) {
      const existing = byDate.get(point.periodDate) || {
        date: point.periodDate,
        actual: null,
        forecast: null,
        budget: null,
      };

      if (point.dataType === 'actual') existing.actual = point.value;
      if (point.dataType === 'forecast') existing.forecast = point.value;
      if (point.dataType === 'budget') existing.budget = point.value;

      byDate.set(point.periodDate, existing);
    }

    // Sort by date
    const data = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));

    return {
      kpiId: definition.id,
      code: definition.code,
      name: definition.name,
      format: definition.format,
      data,
    };
  }

  // ========== Financial Statements ==========

  async getFinancialStatements(
    dealId: string,
    statementType?: StatementType
  ): Promise<FinancialStatement[]> {
    return kpisRepository.getFinancialStatements(dealId, statementType);
  }

  async getLatestFinancialStatement(
    dealId: string,
    statementType: StatementType
  ): Promise<FinancialStatement | null> {
    return kpisRepository.getLatestFinancialStatement(dealId, statementType);
  }

  async saveFinancialStatement(
    dealId: string,
    input: {
      statementType: StatementType;
      periodDate: string;
      data: Record<string, unknown>;
      source?: string;
    },
    userId?: string
  ): Promise<FinancialStatement> {
    return kpisRepository.upsertFinancialStatement(dealId, {
      ...input,
      createdBy: userId,
    });
  }

  // ========== Formatting Helpers ==========

  private formatKpiValue(value: number | null, format: string): string {
    if (value === null) return '—';

    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        // If value > 1, assume it's already in percentage form (e.g., 94.7 = 94.7%)
        // If value <= 1, assume it's a decimal (e.g., 0.947 = 94.7%)
        // Format without decimals for cleaner display
        if (value > 1) {
          return `${Math.round(value)}%`;
        }
        return `${Math.round(value * 100)}%`;
      case 'ratio':
        return `${value.toFixed(2)}x`;
      case 'number':
      default:
        return value.toLocaleString();
    }
  }
}

export const kpisService = new KpisService();

