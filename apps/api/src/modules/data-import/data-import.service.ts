/**
 * Data Import Service
 * Handles Google Sheets OAuth, Excel parsing, and data synchronization
 */

import { dataImportRepository } from './data-import.repository';
import { kpisRepository } from '../kpis/kpis.repository';
import type {
  DataConnection,
  DataConnectionProvider,
  ColumnMapping,
  KpiPeriodType,
  KpiDataType,
} from '@flowveda/shared';

// ============================================
// Service Class
// ============================================
export class DataImportService {
  // ========== Data Connections ==========

  async getConnections(fundId: string): Promise<DataConnection[]> {
    return dataImportRepository.getConnectionsByFundId(fundId);
  }

  async getConnectionById(id: string): Promise<DataConnection | null> {
    return dataImportRepository.getConnectionById(id);
  }

  async createGoogleSheetsConnection(input: {
    fundId: string;
    name: string;
    spreadsheetId: string;
    accessToken: string;
    refreshToken: string;
  }): Promise<DataConnection> {
    // Encrypt credentials before storing
    const credentials = JSON.stringify({
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
    });

    // In production, encrypt these credentials
    const credentialsEncrypted = Buffer.from(credentials).toString('base64');

    return dataImportRepository.createConnection({
      fundId: input.fundId,
      provider: 'google_sheets',
      name: input.name,
      spreadsheetId: input.spreadsheetId,
      credentialsEncrypted,
    });
  }

  async createExcelConnection(input: {
    fundId: string;
    name: string;
  }): Promise<DataConnection> {
    return dataImportRepository.createConnection({
      fundId: input.fundId,
      provider: 'excel',
      name: input.name,
    });
  }

  async updateColumnMapping(
    connectionId: string,
    mappings: ColumnMapping[]
  ): Promise<DataConnection> {
    return dataImportRepository.updateConnection(connectionId, {
      columnMapping: mappings,
    });
  }

  async deleteConnection(id: string): Promise<void> {
    return dataImportRepository.deleteConnection(id);
  }

  // ========== Google Sheets Sync ==========

  async syncGoogleSheets(
    connectionId: string,
    dealId: string,
    userId?: string
  ): Promise<{ success: boolean; rowsImported: number; errors: string[] }> {
    const connection = await dataImportRepository.getConnectionById(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    if (connection.provider !== 'google_sheets') {
      throw new Error('Connection is not a Google Sheets connection');
    }

    // Update status to syncing
    await dataImportRepository.updateConnection(connectionId, {
      syncStatus: 'syncing',
      syncError: null,
    });

    try {
      // In a real implementation, you would:
      // 1. Decrypt credentials
      // 2. Use Google Sheets API to fetch data
      // 3. Parse data according to column mapping
      // 4. Save to kpi_data table

      // For now, simulate a successful sync
      const rowsImported = 0;
      const errors: string[] = [];

      // Placeholder for actual Google Sheets API integration
      // const credentials = JSON.parse(
      //   Buffer.from(connection.credentialsEncrypted || '', 'base64').toString()
      // );
      // const sheetsData = await this.fetchGoogleSheetsData(
      //   connection.spreadsheetId!,
      //   credentials
      // );
      // const importResult = await this.importData(
      //   dealId,
      //   connection.columnMapping,
      //   sheetsData,
      //   'google_sheets',
      //   userId
      // );

      // Update status to success
      await dataImportRepository.updateConnection(connectionId, {
        syncStatus: 'success',
        lastSyncedAt: new Date().toISOString(),
      });

      return { success: true, rowsImported, errors };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update status to error
      await dataImportRepository.updateConnection(connectionId, {
        syncStatus: 'error',
        syncError: errorMessage,
      });

      return { success: false, rowsImported: 0, errors: [errorMessage] };
    }
  }

  // ========== Excel Import ==========

  async importExcel(
    dealId: string,
    connectionId: string,
    data: Array<Record<string, unknown>>,
    userId?: string
  ): Promise<{ success: boolean; rowsImported: number; errors: string[] }> {
    const connection = await dataImportRepository.getConnectionById(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    if (connection.columnMapping.length === 0) {
      throw new Error('Column mapping is not configured');
    }

    const errors: string[] = [];
    let rowsImported = 0;

    try {
      // Parse data according to column mapping
      const kpiDataPoints: Array<{
        kpiId: string;
        periodType: KpiPeriodType;
        periodDate: string;
        dataType: KpiDataType;
        value: number;
        source: string;
        sourceRef: string;
        createdBy?: string;
      }> = [];

      // Get KPI definitions to map codes to IDs
      const definitions = await kpisRepository.getAllDefinitions();
      const codeToId = new Map(definitions.map((d) => [d.code, d.id]));

      for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];

        // Expect a date column
        const dateValue = row['date'] || row['Date'] || row['period'] || row['Period'];
        if (!dateValue) {
          errors.push(`Row ${rowIndex + 1}: Missing date column`);
          continue;
        }

        const periodDate = this.parseDateValue(dateValue);
        if (!periodDate) {
          errors.push(`Row ${rowIndex + 1}: Invalid date format`);
          continue;
        }

        // Process each mapped column
        for (const mapping of connection.columnMapping) {
          const cellValue = row[mapping.columnName];
          if (cellValue === undefined || cellValue === null || cellValue === '') {
            continue;
          }

          const kpiId = codeToId.get(mapping.kpiCode);
          if (!kpiId) {
            errors.push(`Row ${rowIndex + 1}: Unknown KPI code ${mapping.kpiCode}`);
            continue;
          }

          const numericValue = this.parseNumericValue(cellValue);
          if (numericValue === null) {
            errors.push(
              `Row ${rowIndex + 1}: Invalid numeric value for ${mapping.columnName}`
            );
            continue;
          }

          kpiDataPoints.push({
            kpiId,
            periodType: 'monthly',
            periodDate,
            dataType: mapping.dataType,
            value: numericValue,
            source: 'excel',
            sourceRef: `${connection.name}:row${rowIndex + 1}`,
            createdBy: userId,
          });
        }
      }

      // Bulk save KPI data
      if (kpiDataPoints.length > 0) {
        await kpisRepository.bulkUpsertKpiData(dealId, kpiDataPoints);
        rowsImported = kpiDataPoints.length;
      }

      // Update connection status
      await dataImportRepository.updateConnection(connectionId, {
        syncStatus: 'success',
        lastSyncedAt: new Date().toISOString(),
      });

      return { success: true, rowsImported, errors };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await dataImportRepository.updateConnection(connectionId, {
        syncStatus: 'error',
        syncError: errorMessage,
      });

      return { success: false, rowsImported: 0, errors: [errorMessage] };
    }
  }

  // ========== Preview Data ==========

  async previewMappedData(
    connectionId: string,
    sampleData: Array<Record<string, unknown>>
  ): Promise<{
    columns: string[];
    mappedData: Array<{ kpiCode: string; kpiName: string; values: unknown[] }>;
    unmappedColumns: string[];
  }> {
    const connection = await dataImportRepository.getConnectionById(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    // Get all columns from sample data
    const columns = sampleData.length > 0 ? Object.keys(sampleData[0]) : [];

    // Get KPI definitions
    const definitions = await kpisRepository.getAllDefinitions();
    const codeToName = new Map(definitions.map((d) => [d.code, d.name]));

    // Build mapped data preview
    const mappedData: Array<{ kpiCode: string; kpiName: string; values: unknown[] }> = [];
    const mappedColumnNames = new Set(connection.columnMapping.map((m) => m.columnName));

    for (const mapping of connection.columnMapping) {
      const kpiName = codeToName.get(mapping.kpiCode) || mapping.kpiCode;
      const values = sampleData.map((row) => row[mapping.columnName]);
      mappedData.push({ kpiCode: mapping.kpiCode, kpiName, values });
    }

    // Find unmapped columns
    const unmappedColumns = columns.filter(
      (col) => !mappedColumnNames.has(col) && !['date', 'Date', 'period', 'Period'].includes(col)
    );

    return { columns, mappedData, unmappedColumns };
  }

  // ========== Helpers ==========

  private parseDateValue(value: unknown): string | null {
    if (typeof value === 'string') {
      // Try ISO format
      const isoMatch = value.match(/^\d{4}-\d{2}-\d{2}/);
      if (isoMatch) {
        return isoMatch[0];
      }

      // Try common date formats
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }

    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }

    return null;
  }

  private parseNumericValue(value: unknown): number | null {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      // Remove currency symbols, commas, and percentage signs
      const cleaned = value.replace(/[$,%,]/g, '').trim();
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : num;
    }

    return null;
  }
}

export const dataImportService = new DataImportService();

