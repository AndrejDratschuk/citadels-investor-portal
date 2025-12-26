/**
 * Data Import API Client
 * Types and API calls for data import operations
 */

import { api } from './client';
import type { DataConnection, ColumnMapping } from '@flowveda/shared';

// Re-export types for convenience
export type { DataConnection, ColumnMapping };

// ============================================
// API Response Types
// ============================================
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface ImportResult {
  rowsImported: number;
  errors: string[];
}

interface PreviewResult {
  columns: string[];
  mappedData: Array<{ kpiCode: string; kpiName: string; values: unknown[] }>;
  unmappedColumns: string[];
}

// ============================================
// Data Import API
// ============================================
export const dataImportApi = {
  // ========== Connections ==========

  /** Get all data connections for the fund */
  getConnections: async (): Promise<DataConnection[]> => {
    const response = await api.get<ApiResponse<DataConnection[]>>('/import/connections');
    return response.data;
  },

  /** Create a Google Sheets connection */
  createGoogleSheetsConnection: async (input: {
    name: string;
    spreadsheetId: string;
    accessToken: string;
    refreshToken: string;
  }): Promise<DataConnection> => {
    const response = await api.post<ApiResponse<DataConnection>>(
      '/import/connections/google',
      input
    );
    return response.data;
  },

  /** Create an Excel connection */
  createExcelConnection: async (name: string): Promise<DataConnection> => {
    const response = await api.post<ApiResponse<DataConnection>>('/import/connections/excel', {
      name,
    });
    return response.data;
  },

  /** Update column mapping for a connection */
  updateColumnMapping: async (
    connectionId: string,
    mappings: ColumnMapping[]
  ): Promise<DataConnection> => {
    const response = await api.put<ApiResponse<DataConnection>>(
      `/import/connections/${connectionId}/mapping`,
      { mappings }
    );
    return response.data;
  },

  /** Delete a connection */
  deleteConnection: async (connectionId: string): Promise<void> => {
    await api.delete(`/import/connections/${connectionId}`);
  },

  // ========== Sync Operations ==========

  /** Sync Google Sheets data for a deal */
  syncGoogleSheets: async (
    connectionId: string,
    dealId: string
  ): Promise<ImportResult> => {
    const response = await api.post<ApiResponse<ImportResult>>(
      `/import/sync/${connectionId}/deal/${dealId}`
    );
    return response.data;
  },

  /** Import Excel data for a deal */
  importExcel: async (
    connectionId: string,
    dealId: string,
    data: Array<Record<string, unknown>>
  ): Promise<ImportResult> => {
    const response = await api.post<ApiResponse<ImportResult>>(
      `/import/excel/${connectionId}/deal/${dealId}`,
      { data }
    );
    return response.data;
  },

  /** Preview mapped data */
  previewMappedData: async (
    connectionId: string,
    sampleData: Array<Record<string, unknown>>
  ): Promise<PreviewResult> => {
    const response = await api.post<ApiResponse<PreviewResult>>(
      `/import/preview/${connectionId}`,
      { sampleData }
    );
    return response.data;
  },
};

