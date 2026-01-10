/**
 * Data Import API Client
 * Handles data import onboarding API calls
 */

import type {
  SuggestedMapping,
  ParsedFileData,
  ImportResult,
  SampleDataConfig,
  KpiDefinition,
  DataConnection,
} from '@altsui/shared';

// Use same API_URL pattern as main client
const API_BASE = import.meta.env.PROD 
  ? 'https://citadel-investor-portal-production.up.railway.app/api'
  : (import.meta.env.VITE_API_URL || '/api');

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const dataImportApi = {
  /**
   * Get KPI definitions for mapping dropdown
   */
  async getKpiDefinitions(): Promise<KpiDefinition[]> {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_BASE}/import/kpi-definitions`, {
      headers,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch KPI definitions');
    }

    const { data } = await res.json();
    return data;
  },

  /**
   * Suggest column mappings based on column names
   */
  async suggestMappings(
    columnNames: string[],
    sampleValues?: Record<string, unknown[]>
  ): Promise<{
    suggestions: SuggestedMapping[];
    definitions: KpiDefinition[];
  }> {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_BASE}/import/suggest-mappings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ columnNames, sampleValues }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to suggest mappings');
    }

    const { data } = await res.json();
    return data;
  },

  /**
   * Get sample data for preview
   */
  async getSampleData(): Promise<SampleDataConfig> {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_BASE}/import/sample-data`, {
      headers,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch sample data');
    }

    const { data } = await res.json();
    return data;
  },

  /**
   * Import data with column mappings
   */
  async importData(input: {
    fundId: string;
    dealId: string | null;
    connectionName: string;
    mappings: Array<{
      columnName: string;
      kpiCode: string;
      kpiId: string;
      dataType: string;
      include: boolean;
    }>;
    data: Array<Record<string, unknown>>;
  }): Promise<ImportResult> {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_BASE}/import/import`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to import data');
    }

    const { data } = await res.json();
    return data;
  },

  /**
   * Import sample data
   */
  async importSampleData(input: {
    fundId: string;
    dealId?: string | null;
  }): Promise<ImportResult> {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_BASE}/import/import-sample`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ fundId: input.fundId, dealId: input.dealId || null }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to import sample data');
    }

    const { data } = await res.json();
    return data;
  },

  /**
   * Get all data connections for the fund
   */
  async getConnections(): Promise<DataConnection[]> {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_BASE}/import/connections`, {
      headers,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch connections');
    }

    const { data } = await res.json();
    return data;
  },

  /**
   * Delete a data connection
   */
  async deleteConnection(connectionId: string): Promise<void> {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_BASE}/import/connections/${connectionId}`, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete connection');
    }
  },

  /**
   * Sync a data connection
   */
  async syncConnection(connectionId: string, dealId: string): Promise<void> {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_BASE}/import/sync/${connectionId}/deal/${dealId}`, {
      method: 'POST',
      headers,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to sync connection');
    }
  },

  /**
   * Update a connection's deal association
   */
  async updateConnectionDeal(connectionId: string, dealId: string | null): Promise<DataConnection> {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_BASE}/import/connections/${connectionId}/deal`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ dealId }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update connection deal');
    }

    const { data } = await res.json();
    return data;
  },

  /**
   * Parse uploaded file (client-side)
   * Returns preview data from CSV/Excel file
   */
  parseFile(file: File): Promise<ParsedFileData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const lines = content.split('\n').filter(line => line.trim());
          
          if (lines.length === 0) {
            reject(new Error('File is empty'));
            return;
          }

          // Parse CSV
          const headers = parseCSVLine(lines[0]);
          const rows: Record<string, unknown>[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === headers.length) {
              const row: Record<string, unknown> = {};
              headers.forEach((header, idx) => {
                row[header] = parseValue(values[idx]);
              });
              rows.push(row);
            }
          }

          resolve({
            columns: headers,
            rows,
            rowCount: rows.length,
            previewRows: rows.slice(0, 5),
            fileType: getFileType(file.name),
            fileName: file.name,
          });
        } catch (error) {
          reject(new Error('Failed to parse file'));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },
};

// Helper functions
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseValue(value: string): unknown {
  // Remove quotes
  value = value.replace(/^"|"$/g, '').trim();
  
  // Try number
  const num = parseFloat(value.replace(/[$,%]/g, ''));
  if (!isNaN(num) && value !== '') {
    return num;
  }
  
  return value;
}

function getFileType(filename: string): 'csv' | 'xlsx' | 'xls' {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx') return 'xlsx';
  if (ext === 'xls') return 'xls';
  return 'csv';
}

