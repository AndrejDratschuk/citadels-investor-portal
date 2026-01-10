/**
 * Data Import Service
 * Handles Google Sheets OAuth, Excel parsing, and data synchronization
 * ORCHESTRATOR: Manages flow, handles errors, injects dependencies
 */

import { dataImportRepository } from './data-import.repository';
import { kpisRepository } from '../kpis/kpis.repository';
import { 
  SAMPLE_DATA_CONFIG, 
  getSampleDataRows, 
  SAMPLE_DATA_MAPPINGS,
} from './sample-data';
import { parseDateValue, parseNumericValue } from '@altsui/shared';
import type {
  DataConnection,
  ColumnMapping,
  KpiPeriodType,
  KpiDataType,
  ImportResult,
  SampleDataConfig,
} from '@altsui/shared';

// ============================================
// Dependency Injection Types
// ============================================

/** Dependencies injected at call time for strict determinism */
interface ServiceDeps {
  now: Date;
  generateId: () => string;
}

// ============================================
// Service Class
// ============================================
export class DataImportService {
  // ========== Data Connections ==========

  async getConnections(fundId: string): Promise<DataConnection[]> {
    return dataImportRepository.getConnectionsByFundId(fundId);
  }

  async getConnectionsByDeal(dealId: string): Promise<DataConnection[]> {
    return dataImportRepository.getConnectionsByDealId(dealId);
  }

  async getConnectionById(id: string): Promise<DataConnection | null> {
    return dataImportRepository.getConnectionById(id);
  }

  async createGoogleSheetsConnection(input: {
    fundId: string;
    dealId?: string | null;
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
      dealId: input.dealId,
      provider: 'google_sheets',
      name: input.name,
      spreadsheetId: input.spreadsheetId,
      credentialsEncrypted,
    });
  }

  async createExcelConnection(input: {
    fundId: string;
    dealId?: string | null;
    name: string;
  }): Promise<DataConnection> {
    return dataImportRepository.createConnection({
      fundId: input.fundId,
      dealId: input.dealId,
      provider: 'excel',
      name: input.name,
    });
  }

  async updateConnectionDeal(
    connectionId: string,
    dealId: string | null
  ): Promise<DataConnection> {
    return dataImportRepository.updateConnectionDeal(connectionId, dealId);
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
    userId: string | undefined,
    deps: ServiceDeps
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

      const rowsImported = 0;
      const errors: string[] = [];

      // Update status to success with injected timestamp
      await dataImportRepository.updateConnection(connectionId, {
        syncStatus: 'success',
        lastSyncedAt: deps.now.toISOString(),
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
    userId: string | undefined,
    deps: ServiceDeps
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
      const kpiDataPoints = await this.transformDataToKpiPoints(
        data,
        connection.columnMapping,
        'excel',
        connection.name,
        userId
      );

      // Bulk save KPI data
      if (kpiDataPoints.length > 0) {
        await kpisRepository.bulkUpsertKpiData(dealId, kpiDataPoints);
        rowsImported = kpiDataPoints.length;
      }

      // Update connection status with injected timestamp
      await dataImportRepository.updateConnection(connectionId, {
        syncStatus: 'success',
        lastSyncedAt: deps.now.toISOString(),
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

  // ========== Onboarding Import Methods ==========

  /**
   * Create connection and import data in one operation
   * Main method for onboarding flow
   */
  async createConnectionAndImport(
    input: {
      fundId: string;
      dealId: string;
      connectionName: string;
      mappings: Array<{
        columnName: string;
        kpiCode: string;
        kpiId: string;
        dataType: KpiDataType;
        include: boolean;
      }>;
      data: Array<Record<string, unknown>>;
      userId: string;
    },
    deps: ServiceDeps
  ): Promise<ImportResult> {
    try {
      // Filter to only included mappings
      const includedMappings = input.mappings.filter(m => m.include);
      
      // Create connection linked to the deal
      const connection = await dataImportRepository.createConnection({
        fundId: input.fundId,
        dealId: input.dealId,
        provider: 'excel',
        name: input.connectionName,
        columnMapping: includedMappings.map(m => ({
          columnName: m.columnName,
          kpiCode: m.kpiCode,
          dataType: m.dataType,
        })),
      });

      // Get KPI definitions for ID lookup
      const definitions = await kpisRepository.getAllDefinitions();
      const codeToId = new Map(definitions.map(d => [d.code, d.id]));

      // Transform data to KPI points
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

      const errors: Array<{ row: number | null; column: string | null; message: string; severity: 'error' | 'warning' }> = [];
      let rowsSkipped = 0;

      for (let rowIndex = 0; rowIndex < input.data.length; rowIndex++) {
        const row = input.data[rowIndex];

        // Find date value
        const dateValue = row['Date'] || row['date'] || row['Period'] || row['period'];
        const periodDate = parseDateValue(dateValue);

        if (!periodDate) {
          errors.push({
            row: rowIndex + 1,
            column: 'Date',
            message: 'Invalid or missing date',
            severity: 'error',
          });
          rowsSkipped++;
          continue;
        }

        // Process each mapped column
        for (const mapping of includedMappings) {
          const cellValue = row[mapping.columnName];
          if (cellValue === undefined || cellValue === null || cellValue === '') {
            continue;
          }

          const kpiId = codeToId.get(mapping.kpiCode);
          if (!kpiId) {
            errors.push({
              row: rowIndex + 1,
              column: mapping.columnName,
              message: `Unknown KPI code: ${mapping.kpiCode}`,
              severity: 'warning',
            });
            continue;
          }

          const numericValue = parseNumericValue(cellValue);
          if (numericValue === null) {
            errors.push({
              row: rowIndex + 1,
              column: mapping.columnName,
              message: 'Invalid numeric value',
              severity: 'warning',
            });
            continue;
          }

          kpiDataPoints.push({
            kpiId,
            periodType: 'monthly',
            periodDate,
            dataType: mapping.dataType,
            value: numericValue,
            source: 'excel',
            sourceRef: `${input.connectionName}:row${rowIndex + 1}`,
            createdBy: input.userId,
          });
        }
      }

      // Bulk save KPI data
      if (kpiDataPoints.length > 0) {
        await kpisRepository.bulkUpsertKpiData(input.dealId, kpiDataPoints);
      }

      // Update connection status with injected timestamp
      await dataImportRepository.updateConnection(connection.id, {
        syncStatus: 'success',
        lastSyncedAt: deps.now.toISOString(),
      });

      return {
        success: true,
        rowsImported: kpiDataPoints.length,
        rowsSkipped,
        columnsMapped: includedMappings.length,
        errors,
        connectionId: connection.id,
        importedAt: deps.now.toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        rowsImported: 0,
        rowsSkipped: 0,
        columnsMapped: 0,
        errors: [{
          row: null,
          column: null,
          message: error instanceof Error ? error.message : 'Unknown error',
          severity: 'error',
        }],
        connectionId: null,
        importedAt: null,
      };
    }
  }

  /**
   * Import sample data for exploration
   */
  async importSampleData(
    input: {
      fundId: string;
      dealId: string;
      userId: string;
    },
    deps: ServiceDeps
  ): Promise<ImportResult> {
    const sampleData = getSampleDataRows();
    
    // Get KPI definitions for ID lookup
    const definitions = await kpisRepository.getAllDefinitions();
    const codeToId = new Map(definitions.map(d => [d.code, d.id]));

    // Build mappings with real KPI IDs
    const mappingsWithIds = SAMPLE_DATA_MAPPINGS.map(m => ({
      columnName: m.columnName,
      kpiCode: m.kpiCode,
      kpiId: codeToId.get(m.kpiCode) || '',
      dataType: m.dataType,
      include: true,
    })).filter(m => m.kpiId);

    return this.createConnectionAndImport(
      {
        fundId: input.fundId,
        dealId: input.dealId,
        connectionName: 'Sample Data - Oakwood Apartments',
        mappings: mappingsWithIds,
        data: sampleData,
        userId: input.userId,
      },
      deps
    );
  }

  /**
   * Get sample data configuration for preview
   */
  getSampleData(): SampleDataConfig {
    return SAMPLE_DATA_CONFIG;
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

  // ========== Private Helpers ==========

  private async transformDataToKpiPoints(
    data: Array<Record<string, unknown>>,
    columnMapping: ColumnMapping[],
    source: string,
    sourceRef: string,
    userId?: string
  ): Promise<Array<{
    kpiId: string;
    periodType: KpiPeriodType;
    periodDate: string;
    dataType: KpiDataType;
    value: number;
    source: string;
    sourceRef: string;
    createdBy?: string;
  }>> {
    const definitions = await kpisRepository.getAllDefinitions();
    const codeToId = new Map(definitions.map(d => [d.code, d.id]));

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

    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];

      const dateValue = row['date'] || row['Date'] || row['period'] || row['Period'];
      const periodDate = parseDateValue(dateValue);
      if (!periodDate) continue;

      for (const mapping of columnMapping) {
        const cellValue = row[mapping.columnName];
        if (cellValue === undefined || cellValue === null || cellValue === '') {
          continue;
        }

        const kpiId = codeToId.get(mapping.kpiCode);
        if (!kpiId) continue;

        const numericValue = parseNumericValue(cellValue);
        if (numericValue === null) continue;

        kpiDataPoints.push({
          kpiId,
          periodType: 'monthly',
          periodDate,
          dataType: mapping.dataType,
          value: numericValue,
          source,
          sourceRef: `${sourceRef}:row${rowIndex + 1}`,
          createdBy: userId,
        });
      }
    }

    return kpiDataPoints;
  }
}

export const dataImportService = new DataImportService();
