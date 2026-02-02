/**
 * Google Sheets API Client
 * Frontend API calls for Google Sheets OAuth and data operations
 */

import { api } from './client';
import type { DataConnection, ColumnMapping, SyncFrequency } from '@altsui/shared';

// ============================================
// Types
// ============================================
export interface SpreadsheetInfo {
  id: string;
  name: string;
  owner: string;
  modifiedTime: string;
}

export interface SheetInfo {
  sheetId: number;
  title: string;
  rowCount: number;
  columnCount: number;
}

export interface SheetPreview {
  headers: string[];
  rows: string[][];
  totalRows: number;
  format: 'tabular' | 'key-value' | 'mixed';
  sections?: SheetSection[];
}

export interface SheetSection {
  name: string;
  type: 'key-value' | 'tabular';
  startRow: number;
  endRow: number;
  metrics: SheetMetric[];
}

export interface SheetMetric {
  key: string;
  value: string;
  rowIndex: number;
  columnIndex?: number;
  sectionName: string;
  metricType: 'summary' | 'detail';
}

export interface GoogleSheetsStatus {
  connected: boolean;
  connections: DataConnection[];
  hasCredentials: boolean;
  googleEmail: string | null;
}

export interface SaveConnectionInput {
  name: string;
  spreadsheetId: string;
  sheetName: string;
  dealId?: string | null;
  columnMapping: ColumnMapping[];
  syncFrequency: SyncFrequency;
  syncEnabled: boolean;
  // Multi-deal mapping support
  dealMappingMode?: 'fund' | 'single-deal' | 'multi-deal';
  dealIdentifierColumn?: string;
  rowToDealMappings?: { rowIdentifier: string; dealId: string | null }[];
}

// ============================================
// API Client
// ============================================
export const googlesheetsApi = {
  /**
   * Start OAuth flow - returns auth URL
   */
  async connect(): Promise<{ authUrl: string }> {
    const result = await api.get<{ authUrl: string }>('/googlesheets/connect');
    return result;
  },

  /**
   * Get Google Sheets connection status for current fund
   */
  async getStatus(): Promise<GoogleSheetsStatus> {
    return api.get<GoogleSheetsStatus>('/googlesheets/status');
  },

  /**
   * List user's spreadsheets from Google Drive
   */
  async listSpreadsheets(connectionData: string): Promise<{ spreadsheets: SpreadsheetInfo[] }> {
    const params = new URLSearchParams({ connection_data: connectionData });
    return api.get<{ spreadsheets: SpreadsheetInfo[] }>(`/googlesheets/spreadsheets?${params}`);
  },

  /**
   * Get sheets within a spreadsheet
   */
  async getSheets(spreadsheetId: string, connectionData: string): Promise<{ sheets: SheetInfo[] }> {
    const params = new URLSearchParams({ connection_data: connectionData });
    return api.get<{ sheets: SheetInfo[] }>(
      `/googlesheets/spreadsheets/${spreadsheetId}/sheets?${params}`
    );
  },

  /**
   * Preview sheet data (first rows)
   */
  async previewData(
    spreadsheetId: string,
    sheetName: string,
    connectionData: string
  ): Promise<{ preview: SheetPreview }> {
    const params = new URLSearchParams({ connection_data: connectionData });
    return api.get<{ preview: SheetPreview }>(
      `/googlesheets/preview/${spreadsheetId}/${encodeURIComponent(sheetName)}?${params}`
    );
  },

  /**
   * Save connection after wizard completion
   */
  async saveConnection(
    input: SaveConnectionInput,
    connectionData: string
  ): Promise<{ connection: DataConnection }> {
    const params = new URLSearchParams({ connection_data: connectionData });
    return api.post<{ connection: DataConnection }>(`/googlesheets/connections?${params}`, input);
  },

  /**
   * Update sync settings for a connection
   */
  async updateSyncSettings(
    connectionId: string,
    syncFrequency: SyncFrequency,
    syncEnabled: boolean
  ): Promise<{ connection: DataConnection }> {
    return api.patch<{ connection: DataConnection }>(
      `/googlesheets/connections/${connectionId}/sync-settings`,
      { syncFrequency, syncEnabled }
    );
  },

  /**
   * Manually trigger sync for a connection
   */
  async syncNow(connectionId: string): Promise<{ success: boolean; rowCount: number }> {
    return api.post<{ success: boolean; rowCount: number }>(
      `/googlesheets/connections/${connectionId}/sync`
    );
  },

  /**
   * Disconnect a Google Sheets connection
   */
  async disconnect(connectionId: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/googlesheets/connections/${connectionId}`);
  },

  // ============================================
  // Methods using existing credentials (no re-auth needed)
  // ============================================

  /**
   * List spreadsheets using existing credentials
   */
  async listSpreadsheetsWithCredentials(): Promise<{ spreadsheets: SpreadsheetInfo[] }> {
    return api.get<{ spreadsheets: SpreadsheetInfo[] }>('/googlesheets/existing/spreadsheets');
  },

  /**
   * Get sheets using existing credentials
   */
  async getSheetsWithCredentials(spreadsheetId: string): Promise<{ sheets: SheetInfo[] }> {
    return api.get<{ sheets: SheetInfo[] }>(
      `/googlesheets/existing/spreadsheets/${spreadsheetId}/sheets`
    );
  },

  /**
   * Preview sheet data using existing credentials
   */
  async previewDataWithCredentials(
    spreadsheetId: string,
    sheetName: string
  ): Promise<{ preview: SheetPreview }> {
    return api.get<{ preview: SheetPreview }>(
      `/googlesheets/existing/preview/${spreadsheetId}/${encodeURIComponent(sheetName)}`
    );
  },

  /**
   * Save connection using existing credentials
   */
  async saveConnectionWithCredentials(
    input: SaveConnectionInput
  ): Promise<{ connection: DataConnection }> {
    return api.post<{ connection: DataConnection }>('/googlesheets/existing/connections', input);
  },
};
