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
// API Response Types
// ============================================
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// ============================================
// KPI Definitions API
// ============================================
export const kpiDefinitionsApi = {
  /** Get all KPI definitions */
  getAll: async (): Promise<KpiDefinition[]> => {
    const response = await api.get<ApiResponse<KpiDefinition[]>>('/kpis/definitions');
    return response.data;
  },

  /** Get KPI definitions by category */
  getByCategory: async (category: KpiCategory): Promise<KpiDefinition[]> => {
    const response = await api.get<ApiResponse<KpiDefinition[]>>(`/kpis/definitions/${category}`);
    return response.data;
  },

  /** Get KPI definitions with fund preferences */
  getWithPreferences: async (): Promise<KpiDefinitionWithPreference[]> => {
    const response = await api.get<ApiResponse<KpiDefinitionWithPreference[]>>(
      '/kpis/definitions/with-preferences'
    );
    return response.data;
  },
};

// ============================================
// KPI Preferences API
// ============================================
export const kpiPreferencesApi = {
  /** Get fund's KPI preferences */
  get: async (): Promise<KpiPreference[]> => {
    const response = await api.get<ApiResponse<KpiPreference[]>>('/kpis/preferences');
    return response.data;
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
    const response = await api.put<ApiResponse<KpiPreference[]>>('/kpis/preferences', {
      preferences,
    });
    return response.data;
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
    const response = await api.get<ApiResponse<KpiDataPoint[]>>(url);
    return response.data;
  },

  /** Get deal's KPI summary (formatted for display) */
  getSummary: async (dealId: string, dealName?: string): Promise<DealKpiSummary> => {
    const params = dealName ? `?dealName=${encodeURIComponent(dealName)}` : '';
    const response = await api.get<ApiResponse<DealKpiSummary>>(
      `/deals/${dealId}/kpis/summary${params}`
    );
    return response.data;
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
    const response = await api.get<ApiResponse<KpiDataPoint[]>>(url);
    return response.data;
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
    const response = await api.get<ApiResponse<KpiTimeSeries>>(url);
    return response.data;
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
    const response = await api.post<ApiResponse<KpiDataPoint>>(`/deals/${dealId}/kpis`, data);
    return response.data;
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
    const response = await api.post<ApiResponse<KpiDataPoint[]>>(`/deals/${dealId}/kpis/bulk`, {
      data,
    });
    return response.data;
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
    const response = await api.get<ApiResponse<FinancialStatement[]>>(
      `/deals/${dealId}/financials${params}`
    );
    return response.data;
  },

  /** Get latest statement of specific type */
  getLatest: async (dealId: string, type: StatementType): Promise<FinancialStatement> => {
    const response = await api.get<ApiResponse<FinancialStatement>>(
      `/deals/${dealId}/financials/${type}`
    );
    return response.data;
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
    const response = await api.post<ApiResponse<FinancialStatement>>(
      `/deals/${dealId}/financials`,
      data
    );
    return response.data;
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
    const response = await api.get<ApiResponse<OutliersResponse>>(url);
    return response.data;
  },

  /** Get fund's outlier configuration */
  getConfig: async (): Promise<KpiOutlierConfig[]> => {
    const response = await api.get<ApiResponse<KpiOutlierConfig[]>>('/kpis/outlier-config');
    return response.data;
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
    const response = await api.put<ApiResponse<KpiOutlierConfig[]>>('/kpis/outlier-config', {
      configs,
    });
    return response.data;
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

