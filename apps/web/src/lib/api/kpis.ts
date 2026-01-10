/**
 * KPI API Client
 * Types and API calls for KPI system
 */

import { api } from './client';
import type {
  KpiDefinition,
  KpiPreference,
  KpiDataPoint,
  KpiCategory,
  KpiDataType,
  KpiPeriodType,
  KpiCardData,
  KpiTimeSeries,
  DealKpiSummary,
  FinancialStatement,
  StatementType,
  KpiDefinitionWithPreference,
  OutliersResponse,
  KpiOutlierConfig,
  OutlierComparisonBaseline,
} from '@altsui/shared';

// Re-export types for convenience
export type {
  KpiDefinition,
  KpiPreference,
  KpiDataPoint,
  KpiCategory,
  KpiDataType,
  KpiPeriodType,
  KpiCardData,
  KpiTimeSeries,
  DealKpiSummary,
  FinancialStatement,
  StatementType,
  KpiDefinitionWithPreference,
  OutliersResponse,
  KpiOutlierConfig,
  OutlierComparisonBaseline,
};

// ============================================
// KPI Definitions API
// ============================================
export const kpiDefinitionsApi = {
  /** Get all KPI definitions */
  getAll: async (): Promise<KpiDefinition[]> => {
    // api.get already extracts .data from the ApiResponse
    return api.get<KpiDefinition[]>('/kpis/definitions');
  },

  /** Get KPI definitions by category */
  getByCategory: async (category: KpiCategory): Promise<KpiDefinition[]> => {
    // api.get already extracts .data from the ApiResponse
    return api.get<KpiDefinition[]>(`/kpis/definitions/${category}`);
  },

  /** Get KPI definitions with fund preferences */
  getWithPreferences: async (): Promise<KpiDefinitionWithPreference[]> => {
    // api.get already extracts .data from the ApiResponse
    return api.get<KpiDefinitionWithPreference[]>('/kpis/definitions/with-preferences');
  },
};

// ============================================
// KPI Preferences API
// ============================================
export const kpiPreferencesApi = {
  /** Get fund's KPI preferences */
  get: async (): Promise<KpiPreference[]> => {
    // api.get already extracts .data from the ApiResponse
    return api.get<KpiPreference[]>('/kpis/preferences');
  },

  /** Update fund's KPI preferences */
  update: async (
    preferences: Array<{
      kpiId: string;
      isFeatured?: boolean;
      isEnabled?: boolean;
      sortOrder?: number;
    }>
  ): Promise<KpiPreference[]> => {
    // api.put already extracts .data from the ApiResponse
    return api.put<KpiPreference[]>('/kpis/preferences', { preferences });
  },
};

// ============================================
// Deal KPI Data API
// ============================================
export interface KpiDataQueryOptions {
  category?: KpiCategory;
  dataType?: KpiDataType;
  periodType?: KpiPeriodType;
  startDate?: string;
  endDate?: string;
}

export const dealKpisApi = {
  /** Get deal's KPI data with optional filters */
  getData: async (dealId: string, options?: KpiDataQueryOptions): Promise<KpiDataPoint[]> => {
    const params = new URLSearchParams();
    if (options?.category) params.append('category', options.category);
    if (options?.dataType) params.append('dataType', options.dataType);
    if (options?.periodType) params.append('periodType', options.periodType);
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);

    const query = params.toString();
    const url = `/deals/${dealId}/kpis${query ? `?${query}` : ''}`;
    // api.get already extracts .data from the ApiResponse
    return api.get<KpiDataPoint[]>(url);
  },

  /** Get deal's KPI summary (formatted for display) */
  getSummary: async (dealId: string, dealName?: string, startDate?: string, endDate?: string): Promise<DealKpiSummary> => {
    const params = new URLSearchParams();
    if (dealName) params.append('dealName', dealName);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString();
    // api.get already extracts .data from the ApiResponse
    return api.get<DealKpiSummary>(`/deals/${dealId}/kpis/summary${query ? `?${query}` : ''}`);
  },

  /** Get deal's KPIs by category */
  getByCategory: async (
    dealId: string,
    category: KpiCategory,
    options?: Omit<KpiDataQueryOptions, 'category'>
  ): Promise<KpiDataPoint[]> => {
    const params = new URLSearchParams();
    if (options?.dataType) params.append('dataType', options.dataType);
    if (options?.periodType) params.append('periodType', options.periodType);
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);

    const query = params.toString();
    const url = `/deals/${dealId}/kpis/category/${category}${query ? `?${query}` : ''}`;
    // api.get already extracts .data from the ApiResponse
    return api.get<KpiDataPoint[]>(url);
  },

  /** Get KPI time series for charts */
  getTimeSeries: async (
    dealId: string,
    kpiId: string,
    options?: {
      periodType?: KpiPeriodType;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<KpiTimeSeries> => {
    const params = new URLSearchParams();
    if (options?.periodType) params.append('periodType', options.periodType);
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);

    const query = params.toString();
    const url = `/deals/${dealId}/kpis/${kpiId}/timeseries${query ? `?${query}` : ''}`;
    // api.get already extracts .data from the ApiResponse
    return api.get<KpiTimeSeries>(url);
  },

  /** Save single KPI data point */
  saveData: async (
    dealId: string,
    data: {
      kpiId: string;
      periodType: KpiPeriodType;
      periodDate: string;
      dataType: KpiDataType;
      value: number;
      source?: string;
    }
  ): Promise<KpiDataPoint> => {
    // api.post already extracts .data from the ApiResponse
    return api.post<KpiDataPoint>(`/deals/${dealId}/kpis`, data);
  },

  /** Bulk save KPI data */
  bulkSaveData: async (
    dealId: string,
    data: Array<{
      kpiId: string;
      periodType: KpiPeriodType;
      periodDate: string;
      dataType: KpiDataType;
      value: number;
      source?: string;
    }>
  ): Promise<KpiDataPoint[]> => {
    // api.post already extracts .data from the ApiResponse
    return api.post<KpiDataPoint[]>(`/deals/${dealId}/kpis/bulk`, { data });
  },

  /** Delete KPI data point */
  deleteData: async (dealId: string, dataId: string): Promise<void> => {
    await api.delete(`/deals/${dealId}/kpis/${dataId}`);
  },
};

// ============================================
// Financial Statements API
// ============================================
export const financialStatementsApi = {
  /** Get deal's financial statements */
  getAll: async (dealId: string, type?: StatementType): Promise<FinancialStatement[]> => {
    const params = type ? `?type=${type}` : '';
    // api.get already extracts .data from the ApiResponse
    return api.get<FinancialStatement[]>(`/deals/${dealId}/financials${params}`);
  },

  /** Get latest statement of specific type */
  getLatest: async (dealId: string, type: StatementType): Promise<FinancialStatement> => {
    // api.get already extracts .data from the ApiResponse
    return api.get<FinancialStatement>(`/deals/${dealId}/financials/${type}`);
  },

  /** Save financial statement */
  save: async (
    dealId: string,
    data: {
      statementType: StatementType;
      periodDate: string;
      data: Record<string, unknown>;
      source?: string;
    }
  ): Promise<FinancialStatement> => {
    // api.post already extracts .data from the ApiResponse
    return api.post<FinancialStatement>(`/deals/${dealId}/financials`, data);
  },
};

// ============================================
// KPI Outliers API
// ============================================
export interface OutliersQueryOptions {
  periodDate?: string;
  topCount?: number;
  startDate?: string;
  endDate?: string;
}

export const outliersApi = {
  /** Get deal's KPI outliers (top/bottom performers) */
  getOutliers: async (
    dealId: string,
    options?: OutliersQueryOptions
  ): Promise<OutliersResponse> => {
    const params = new URLSearchParams();
    if (options?.periodDate) params.append('periodDate', options.periodDate);
    if (options?.topCount) params.append('topCount', options.topCount.toString());
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);

    const query = params.toString();
    const url = `/deals/${dealId}/kpis/outliers${query ? `?${query}` : ''}`;
    // api.get already extracts .data from the ApiResponse
    return api.get<OutliersResponse>(url);
  },

  /** Get fund's outlier configuration */
  getConfig: async (): Promise<KpiOutlierConfig[]> => {
    // api.get already extracts .data from the ApiResponse
    return api.get<KpiOutlierConfig[]>('/kpis/outlier-config');
  },

  /** Update fund's outlier configuration */
  updateConfig: async (
    configs: Array<{
      kpiId: string;
      alertThreshold?: number;
      comparisonBaseline?: OutlierComparisonBaseline;
      greenThreshold?: number;
      redThreshold?: number;
      isInverseMetric?: boolean;
      enabledInOutliers?: boolean;
    }>
  ): Promise<KpiOutlierConfig[]> => {
    // api.put already extracts .data from the ApiResponse
    return api.put<KpiOutlierConfig[]>('/kpis/outlier-config', { configs });
  },
};

// ============================================
// Combined KPIs API (convenience export)
// ============================================
export const kpisApi = {
  definitions: kpiDefinitionsApi,
  preferences: kpiPreferencesApi,
  deals: dealKpisApi,
  financials: financialStatementsApi,
  outliers: outliersApi,
};

