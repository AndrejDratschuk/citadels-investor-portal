/**
 * Google Sheets Service
 * Handles OAuth, spreadsheet listing, data fetching, and sync operations
 */

import { google, sheets_v4, drive_v3 } from 'googleapis';
import { supabaseAdmin } from '../../common/database/supabase';
import type { DataConnection, ColumnMapping, SyncFrequency } from '@altsui/shared';

// ============================================
// Configuration
// ============================================
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_SHEETS_REDIRECT_URI =
  process.env.GOOGLE_SHEETS_REDIRECT_URI || 'http://localhost:3001/api/googlesheets/callback';

// OAuth scopes for Google Sheets access
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

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
  // For mixed/complex sheets
  format: 'tabular' | 'key-value' | 'mixed';
  sections?: SheetSection[];
}

export interface SheetSection {
  name: string;
  type: 'key-value' | 'tabular';
  startRow: number;
  endRow: number;
  metrics: SheetMetric[];
  // For tabular sections: actual table data for row-level operations
  tableHeaders?: string[];
  tableRows?: string[][];
}

export interface SheetMetric {
  key: string;
  value: string;
  rowIndex: number;
  columnIndex?: number; // For tabular sections, which column this is
  sectionName: string;
  metricType: 'summary' | 'detail'; // summary = fund-level, detail = property/asset level
}

export interface GoogleSheetsConnection {
  id: string;
  fundId: string;
  spreadsheetId: string;
  sheetName: string;
  googleEmail: string;
  accessToken: string;
  refreshToken: string;
}

// ============================================
// Helper Functions
// ============================================
function createOAuth2Client(): InstanceType<typeof google.auth.OAuth2> {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_SHEETS_REDIRECT_URI
  );
}

function encryptCredentials(accessToken: string, refreshToken: string): string {
  // In production, use proper encryption (e.g., AES-256)
  const credentials = JSON.stringify({ accessToken, refreshToken });
  return Buffer.from(credentials).toString('base64');
}

function decryptCredentials(encrypted: string): { accessToken: string; refreshToken: string } {
  const decoded = Buffer.from(encrypted, 'base64').toString();
  return JSON.parse(decoded);
}

function calculateNextSyncTime(frequency: SyncFrequency, now: Date): Date | null {
  if (frequency === 'manual') return null;

  const minutes: Record<SyncFrequency, number> = {
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1h': 60,
    '6h': 360,
    '24h': 1440,
    manual: 0,
  };

  const nextSync = new Date(now);
  nextSync.setMinutes(nextSync.getMinutes() + minutes[frequency]);
  return nextSync;
}

// ============================================
// Service Class
// ============================================
export class GoogleSheetsService {
  /**
   * Check if Google Sheets is properly configured
   */
  isConfigured(): boolean {
    return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
  }

  /**
   * Generate OAuth URL for Google Sheets authorization
   */
  getAuthUrl(state: string): string {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error('Google Sheets is not configured. Missing GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET.');
    }

    const oauth2Client = createOAuth2Client();

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state,
      prompt: 'consent', // Force consent to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    email: string;
  }> {
    const oauth2Client = createOAuth2Client();

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to get tokens from Google');
    }

    // Get user email
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const expiresAt = new Date(tokens.expiry_date || Date.now() + 3600 * 1000);

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      email: userInfo.data.email || '',
    };
  }

  /**
   * Refresh access token if expired
   */
  async refreshAccessToken(connectionId: string): Promise<string> {
    const { data: connection, error } = await supabaseAdmin
      .from('data_connections')
      .select('credentials_encrypted')
      .eq('id', connectionId)
      .single();

    if (error || !connection?.credentials_encrypted) {
      throw new Error('Connection not found');
    }

    const { refreshToken } = decryptCredentials(connection.credentials_encrypted);

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    // Update stored credentials
    const newEncrypted = encryptCredentials(credentials.access_token, refreshToken);
    await supabaseAdmin
      .from('data_connections')
      .update({
        credentials_encrypted: newEncrypted,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId);

    return credentials.access_token;
  }

  /**
   * Get authenticated OAuth client for a connection
   */
  private async getAuthenticatedClient(
    accessToken: string,
    refreshToken: string
  ): Promise<InstanceType<typeof google.auth.OAuth2>> {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    return oauth2Client;
  }

  /**
   * List user's spreadsheets from Google Drive
   */
  async listSpreadsheets(accessToken: string, refreshToken: string): Promise<SpreadsheetInfo[]> {
    const auth = await this.getAuthenticatedClient(accessToken, refreshToken);
    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
      fields: 'files(id, name, owners, modifiedTime)',
      orderBy: 'modifiedTime desc',
      pageSize: 50,
    });

    return (response.data.files || []).map((file: drive_v3.Schema$File) => ({
      id: file.id || '',
      name: file.name || 'Untitled',
      owner: file.owners?.[0]?.emailAddress || 'Unknown',
      modifiedTime: file.modifiedTime || '',
    }));
  }

  /**
   * Get sheets within a spreadsheet
   */
  async getSpreadsheetSheets(
    accessToken: string,
    refreshToken: string,
    spreadsheetId: string
  ): Promise<SheetInfo[]> {
    const auth = await this.getAuthenticatedClient(accessToken, refreshToken);
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties',
    });

    return (response.data.sheets || []).map((sheet: sheets_v4.Schema$Sheet) => ({
      sheetId: sheet.properties?.sheetId || 0,
      title: sheet.properties?.title || 'Sheet',
      rowCount: sheet.properties?.gridProperties?.rowCount || 0,
      columnCount: sheet.properties?.gridProperties?.columnCount || 0,
    }));
  }

  /**
   * Preview sheet data - detects sections and handles mixed formats
   * Supports: key-value sections, tabular sections, and mixed sheets
   */
  async previewSheetData(
    accessToken: string,
    refreshToken: string,
    spreadsheetId: string,
    sheetName: string,
    maxRows: number = 200
  ): Promise<SheetPreview> {
    const auth = await this.getAuthenticatedClient(accessToken, refreshToken);
    const sheets = google.sheets({ version: 'v4', auth });

    // Get all data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'`,
    });

    const values = response.data.values || [];
    
    // Detect and parse sections in the sheet
    const sections = this.detectSections(values);
    
    // If we found distinct sections, it's a mixed format
    if (sections.length > 1) {
      // Collect all metrics from all sections
      const allMetrics: SheetMetric[] = [];
      for (const section of sections) {
        allMetrics.push(...section.metrics);
      }
      
      return {
        headers: ['Metric Name', 'Value', 'Section'],
        rows: allMetrics.slice(0, maxRows).map((m) => [m.key, m.value, m.sectionName]),
        totalRows: allMetrics.length,
        format: 'mixed',
        sections,
      };
    }
    
    // Single section - determine its type
    if (sections.length === 1) {
      const section = sections[0];
      return {
        headers: section.type === 'tabular' 
          ? section.metrics.filter((m) => m.metricType === 'summary').map((m) => m.key)
          : ['Metric Name', 'Value'],
        rows: section.metrics.slice(0, maxRows).map((m) => [m.key, m.value]),
        totalRows: section.metrics.length,
        format: section.type,
        sections,
      };
    }
    
    // Fallback: treat as simple tabular
    const headers = values[0] || [];
    const dataRows = values.slice(1);

    return {
      headers: headers.map(String),
      rows: dataRows.slice(0, maxRows).map((row) => row.map(String)),
      totalRows: dataRows.length,
      format: 'tabular',
    };
  }

  /**
   * Detect distinct sections in a sheet (e.g., "FUND OVERVIEW", "PROPERTY PORTFOLIO SUMMARY")
   */
  private detectSections(values: unknown[][]): SheetSection[] {
    const sections: SheetSection[] = [];
    let currentSection: Partial<SheetSection> | null = null;
    
    for (let i = 0; i < values.length; i++) {
      const row = values[i] || [];
      const firstCell = String(row[0] || '').trim();
      
      // Detect section headers (usually all caps with specific keywords)
      if (this.isSectionHeader(firstCell, row)) {
        // Save previous section if exists and has content
        if (currentSection && currentSection.name && currentSection.startRow !== undefined) {
          currentSection.endRow = i - 1;
          // Only save if section has some rows
          if (currentSection.endRow >= currentSection.startRow) {
            this.extractSectionMetrics(currentSection as SheetSection, values);
            if ((currentSection as SheetSection).metrics.length > 0) {
              sections.push(currentSection as SheetSection);
            }
          }
        }
        
        // Start new section
        currentSection = {
          name: firstCell,
          type: 'key-value', // Default, will be updated if we find a table header
          startRow: i + 1,
          endRow: values.length - 1,
          metrics: [],
        };
        continue;
      }
      
      // Detect if this row is a table header (many columns with short text labels)
      // Only check if we're in a section and haven't already found a table header
      if (currentSection && currentSection.type === 'key-value' && this.isTableHeaderRow(row)) {
        currentSection.type = 'tabular';
        currentSection.startRow = i; // Table starts at header row
      }
    }
    
    // Save last section
    if (currentSection && currentSection.name && currentSection.startRow !== undefined) {
      currentSection.endRow = values.length - 1;
      if (currentSection.endRow >= currentSection.startRow) {
        this.extractSectionMetrics(currentSection as SheetSection, values);
        if ((currentSection as SheetSection).metrics.length > 0) {
          sections.push(currentSection as SheetSection);
        }
      }
    }
    
    // If no sections detected, treat entire sheet as one section
    if (sections.length === 0) {
      const singleSection: SheetSection = {
        name: 'Sheet Data',
        type: this.detectSimpleFormat(values),
        startRow: 0,
        endRow: values.length - 1,
        metrics: [],
      };
      this.extractSectionMetrics(singleSection, values);
      sections.push(singleSection);
    }
    
    return sections;
  }

  /**
   * Check if a row is a section header
   * More strict: requires ALL CAPS and contains specific section keywords
   */
  private isSectionHeader(firstCell: string, row: unknown[]): boolean {
    if (!firstCell || firstCell.length < 5) return false;
    
    // Must have few or no values in other columns
    const otherCells = row.slice(1).filter((c) => c !== null && c !== undefined && String(c).trim());
    if (otherCells.length > 0) return false;
    
    // Must be ALL CAPS
    const isAllCaps = firstCell === firstCell.toUpperCase();
    if (!isAllCaps) return false;
    
    // Must contain section keywords
    const sectionKeywords = [
      'overview', 'summary', 'portfolio', 'details', 'breakdown',
      'total', 'analysis', 'metrics', 'performance', 'returns', 
      'holdings', 'properties', 'assets', 'investments', 'fund'
    ];
    
    const lowerCell = firstCell.toLowerCase();
    const hasKeyword = sectionKeywords.some((kw) => lowerCell.includes(kw));
    
    return hasKeyword;
  }

  /**
   * Check if a row looks like a table header row
   * Headers are typically short text labels, not numbers/dates/currency
   */
  private isTableHeaderRow(row: unknown[]): boolean {
    // Table headers typically have 4+ columns with content
    const populatedCells = row.filter((c) => c !== null && c !== undefined && String(c).trim());
    if (populatedCells.length < 4) return false;
    
    // Check if cells look like headers
    let headerLikeCells = 0;
    let dataLikeCells = 0;
    
    for (const cell of populatedCells) {
      const cellStr = String(cell).trim();
      if (!cellStr) continue;
      
      // Data indicators: starts with $, is a number, is a date, is a percentage
      const isNumber = !isNaN(Number(cellStr.replace(/[,$%]/g, '')));
      const isCurrency = cellStr.startsWith('$') || cellStr.includes('$');
      const isDate = /^\d{4}-\d{2}-\d{2}$/.test(cellStr) || /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(cellStr);
      const isPercentage = cellStr.endsWith('%');
      
      if (isCurrency || isDate || isPercentage || (isNumber && !cellStr.includes(' '))) {
        dataLikeCells++;
      } else if (cellStr.length > 1 && cellStr.length < 50) {
        // Headers are usually moderate length text
        headerLikeCells++;
      }
    }
    
    // It's a header row if most cells look like headers, not data
    return headerLikeCells >= 4 && headerLikeCells > dataLikeCells;
  }

  /**
   * Detect simple format for a sheet without section headers
   */
  private detectSimpleFormat(values: unknown[][]): 'tabular' | 'key-value' {
    if (values.length < 3) return 'tabular';
    
    // Check first few rows
    let keyValueScore = 0;
    let tabularScore = 0;
    
    const firstRow = values[0] || [];
    if (firstRow.length > 4) tabularScore += 2;
    
    for (let i = 0; i < Math.min(20, values.length); i++) {
      const row = values[i] || [];
      const populated = row.filter((c) => c !== null && c !== undefined && String(c).trim()).length;
      
      if (populated <= 2) keyValueScore++;
      if (populated >= 4) tabularScore++;
    }
    
    return keyValueScore > tabularScore ? 'key-value' : 'tabular';
  }

  /**
   * Extract metrics from a section based on its type
   */
  private extractSectionMetrics(section: SheetSection, values: unknown[][]): void {
    const metrics: SheetMetric[] = [];
    
    if (section.type === 'key-value') {
      // Extract key-value pairs
      for (let i = section.startRow; i <= section.endRow && i < values.length; i++) {
        const row = values[i] || [];
        const key = String(row[0] || '').trim();
        
        // Skip empty rows and section headers
        if (!key) continue;
        if (this.isSectionHeader(key, row)) continue;
        
        // Find the value - it might be in column B, C, or the first non-empty column after A
        let value = '';
        for (let col = 1; col < row.length; col++) {
          const cellValue = String(row[col] || '').trim();
          if (cellValue) {
            value = cellValue;
            break;
          }
        }
        
        // Skip rows without a value
        if (!value) continue;
        
        metrics.push({
          key,
          value,
          rowIndex: i,
          sectionName: section.name,
          metricType: 'summary',
        });
      }
    } else {
      // Extract tabular data - find the header row first
      // The header row is at section.startRow (set when we detected it as a table header)
      const headerRowIdx = section.startRow;
      const headerRow = values[headerRowIdx] || [];
      
      // Get headers - filter out empty cells
      const headers: { name: string; colIdx: number }[] = [];
      for (let colIdx = 0; colIdx < headerRow.length; colIdx++) {
        const header = String(headerRow[colIdx] || '').trim();
        if (header) {
          headers.push({ name: header, colIdx });
        }
      }
      
      // Get ALL data rows (not just sample) - skip header row, stop before TOTAL/SUMMARY rows
      const allDataRows: string[][] = [];
      for (let i = headerRowIdx + 1; i <= section.endRow && i < values.length; i++) {
        const row = values[i] || [];
        const firstCell = String(row[0] || '').trim().toUpperCase();
        // Skip total/summary rows
        if (firstCell.includes('TOTAL') || firstCell.includes('SUMMARY') || firstCell.includes('AVERAGE')) {
          continue;
        }
        // Skip empty rows
        const hasData = row.some((c) => c !== null && c !== undefined && String(c).trim());
        if (!hasData) continue;
        
        // Extract values for each header column
        const rowData: string[] = headers.map(({ colIdx }) => String(row[colIdx] || '').trim());
        allDataRows.push(rowData);
      }
      
      // Store actual table data for row-level operations (like multi-deal mapping)
      section.tableHeaders = headers.map((h) => h.name);
      section.tableRows = allDataRows;
      
      // Get sample values from first few data rows for metric display
      const sampleRows = allDataRows.slice(0, 3);
      
      // Add each column header as a mappable metric
      for (let hIdx = 0; hIdx < headers.length; hIdx++) {
        const { name: header, colIdx } = headers[hIdx];
        // Find first non-empty sample value from data rows
        let sampleValue = '';
        for (const row of sampleRows) {
          const val = row[hIdx];
          if (val) {
            sampleValue = val;
            break;
          }
        }
        
        metrics.push({
          key: header,
          value: sampleValue ? `Sample: ${sampleValue}` : 'No data',
          rowIndex: headerRowIdx,
          columnIndex: colIdx,
          sectionName: section.name,
          metricType: 'detail',
        });
      }
    }
    
    section.metrics = metrics;
  }

  /**
   * Fetch all sheet data for sync (legacy format with headers)
   */
  async fetchSheetData(
    accessToken: string,
    refreshToken: string,
    spreadsheetId: string,
    sheetName: string
  ): Promise<{ headers: string[]; rows: string[][] }> {
    const auth = await this.getAuthenticatedClient(accessToken, refreshToken);
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'`,
    });

    const values = response.data.values || [];
    const headers = values[0] || [];
    const dataRows = values.slice(1);

    return {
      headers: headers.map(String),
      rows: dataRows.map((row) => row.map(String)),
    };
  }

  /**
   * Fetch raw sheet data without header assumption (for mixed-format sheets)
   */
  async fetchRawSheetData(
    accessToken: string,
    refreshToken: string,
    spreadsheetId: string,
    sheetName: string
  ): Promise<string[][]> {
    const auth = await this.getAuthenticatedClient(accessToken, refreshToken);
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'`,
    });

    const values = response.data.values || [];
    return values.map((row) => (row || []).map(String));
  }

  /**
   * Sync data from Google Sheets to KPI tables
   * This is the core sync logic that processes sheet data and saves to kpi_data
   * Handles mixed-format sheets with both key-value and tabular sections
   */
  async syncDataToKpi(
    connectionId: string,
    dealId: string,
    columnMapping: ColumnMapping[],
    accessToken: string,
    refreshToken: string,
    spreadsheetId: string,
    sheetName: string,
    now: Date
  ): Promise<{ rowCount: number; kpiCount: number }> {
    // Fetch ALL raw data from Google Sheets (no header assumption)
    const allRows = await this.fetchRawSheetData(
      accessToken,
      refreshToken,
      spreadsheetId,
      sheetName
    );

    console.log(`[Sync] Fetched ${allRows.length} rows from sheet "${sheetName}"`);

    // Get all KPI definitions to map codes to IDs
    const { data: kpiDefs, error: kpiError } = await supabaseAdmin
      .from('kpi_definitions')
      .select('id, code');

    if (kpiError || !kpiDefs) {
      throw new Error('Failed to fetch KPI definitions');
    }

    const kpiCodeToId = new Map(kpiDefs.map((kpi) => [kpi.code, kpi.id]));

    // Find header rows in the data (rows that look like column headers)
    // A header row typically has multiple text values and appears before data rows
    const headerRowIndices = this.findHeaderRows(allRows);
    console.log(`[Sync] Found ${headerRowIndices.length} potential header rows at indices:`, headerRowIndices);

    // Process each mapping and collect KPI values
    const kpiValues: {
      kpi_id: string;
      value: number;
      columnName: string;
    }[] = [];

    for (const mapping of columnMapping) {
      const kpiId = kpiCodeToId.get(mapping.kpiCode);
      if (!kpiId) {
        console.warn(`[Sync] KPI code not found: ${mapping.kpiCode}`);
        continue;
      }

      const columnName = mapping.columnName;
      let foundValue: number | null = null;

      // Strategy 1: Key-value lookup - find row where column A matches the columnName
      const kvRow = allRows.find((row) => {
        const cellA = (row[0] || '').trim().toLowerCase();
        return cellA === columnName.toLowerCase();
      });

      if (kvRow) {
        // Found in key-value format - get value from column B, C, or first non-empty numeric
        for (let i = 1; i < kvRow.length; i++) {
          const numValue = this.parseNumericValue(kvRow[i]);
          if (numValue !== null) {
            foundValue = numValue;
            console.log(`[Sync] Key-value match: "${columnName}" = ${foundValue}`);
            break;
          }
        }
      }

      // Strategy 2: Tabular lookup - find a header row containing this column name
      if (foundValue === null) {
        for (const headerIdx of headerRowIndices) {
          const headerRow = allRows[headerIdx];
          const colIndex = headerRow.findIndex(
            (h) => (h || '').trim().toLowerCase() === columnName.toLowerCase()
          );

          if (colIndex !== -1) {
            // Found column in this header row - get value from first data row after header
            for (let dataIdx = headerIdx + 1; dataIdx < allRows.length; dataIdx++) {
              const dataRow = allRows[dataIdx];
              // Skip if this row is another header or empty
              if (headerRowIndices.includes(dataIdx) || !dataRow || dataRow.every((c) => !c?.trim())) {
                continue;
              }
              const cellValue = dataRow[colIndex];
              if (cellValue) {
                const numValue = this.parseNumericValue(cellValue);
                if (numValue !== null) {
                  foundValue = numValue;
                  console.log(`[Sync] Tabular match: "${columnName}" (col ${colIndex}) = ${foundValue}`);
                  break;
                }
              }
            }
            if (foundValue !== null) break;
          }
        }
      }

      if (foundValue !== null) {
        kpiValues.push({
          kpi_id: kpiId,
          value: foundValue,
          columnName,
        });
      } else {
        console.warn(`[Sync] Could not find value for "${columnName}" (KPI: ${mapping.kpiCode})`);
      }
    }

    console.log(`[Sync] Extracted ${kpiValues.length} KPI values from ${columnMapping.length} mappings`);

    // Determine period date (use current month start for now)
    const periodDate = new Date(now.getFullYear(), now.getMonth(), 1);

    // Upsert KPI values to the database
    let insertedCount = 0;
    for (const kpiValue of kpiValues) {
      const { error } = await supabaseAdmin
        .from('kpi_data')
        .upsert(
          {
            deal_id: dealId,
            kpi_id: kpiValue.kpi_id,
            period_type: 'monthly',
            period_date: periodDate.toISOString().split('T')[0],
            data_type: 'actual',
            value: kpiValue.value,
            source: 'google_sheets',
            source_ref: connectionId,
            imported_at: now.toISOString(),
            updated_at: now.toISOString(),
          },
          {
            onConflict: 'deal_id,kpi_id,period_type,period_date,data_type',
          }
        );

      if (error) {
        console.error(`Failed to upsert KPI ${kpiValue.columnName}:`, error);
      } else {
        insertedCount++;
      }
    }

    // Also update the deal's kpis JSONB field and direct fields for header cards
    await this.updateDealFromSync(dealId, columnMapping, kpiValues, now);

    return { rowCount: allRows.length, kpiCount: insertedCount };
  }

  /**
   * Update deal header fields from synced KPI values
   */
  private async updateDealFromSync(
    dealId: string,
    columnMapping: ColumnMapping[],
    kpiValues: { kpi_id: string; value: number; columnName: string }[],
    now: Date
  ): Promise<void> {
    // Build a map of kpiCode -> value from our synced data
    const kpiCodeToValue = new Map<string, number>();
    for (const mapping of columnMapping) {
      const matchingValue = kpiValues.find((v) => v.columnName === mapping.columnName);
      if (matchingValue) {
        kpiCodeToValue.set(mapping.kpiCode, matchingValue.value);
      }
    }

    // Get current deal data
    const { data: currentDeal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select('kpis, acquisition_price, acquisition_date')
      .eq('id', dealId)
      .single();

    if (dealError) {
      console.error('Failed to fetch deal for sync update:', dealError);
      return;
    }

    // Build updates object
    const updates: Record<string, unknown> = {
      updated_at: now.toISOString(),
    };

    // Update kpis JSONB field
    const currentKpis = (currentDeal?.kpis as Record<string, unknown>) || {};
    const newKpis: Record<string, unknown> = { ...currentKpis };

    // Map common KPI codes to kpis JSONB fields
    const kpiMapping: Record<string, string> = {
      noi: 'noi',
      annualized_noi: 'noi',
      in_place_noi: 'noi',
      cap_rate: 'capRate',
      cap_rate_at_acquisition: 'capRate',
      occupancy: 'occupancyRate',
      occupancy_rate: 'occupancyRate',
    };

    for (const [kpiCode, jsonField] of Object.entries(kpiMapping)) {
      const value = kpiCodeToValue.get(kpiCode);
      if (value !== undefined) {
        // Convert percentage values (stored as whole numbers) to decimals for rates
        if (jsonField === 'capRate' || jsonField === 'occupancyRate') {
          newKpis[jsonField] = value > 1 ? value / 100 : value;
        } else {
          newKpis[jsonField] = value;
        }
      }
    }

    // Update direct deal fields
    const acquisitionPrice = kpiCodeToValue.get('acquisition_price');
    if (acquisitionPrice !== undefined) {
      updates.acquisition_price = acquisitionPrice;
    }

    // Only update kpis if we have changes
    if (Object.keys(newKpis).length > Object.keys(currentKpis).length || 
        JSON.stringify(newKpis) !== JSON.stringify(currentKpis)) {
      updates.kpis = newKpis;
    }

    // Apply updates if there are any beyond just updated_at
    if (Object.keys(updates).length > 1) {
      const { error: updateError } = await supabaseAdmin
        .from('deals')
        .update(updates)
        .eq('id', dealId);

      if (updateError) {
        console.error('Failed to update deal from sync:', updateError);
      } else {
        console.log('Updated deal header data from sync:', Object.keys(updates));
      }
    }
  }

  /**
   * Parse a string value to a number, handling currency, percentages, etc.
   * Percentages are converted to decimals (19.2% → 0.192)
   */
  private parseNumericValue(value: string): number | null {
    if (!value || typeof value !== 'string') return null;
    
    // Remove common formatting
    let cleaned = value.trim();
    
    // Handle percentages - convert to decimal (19.2% → 0.192)
    const isPercentage = cleaned.endsWith('%');
    if (isPercentage) {
      cleaned = cleaned.slice(0, -1);
    }
    
    // Handle multipliers (e.g., "1.52x") - keep as-is
    const isMultiplier = cleaned.toLowerCase().endsWith('x');
    if (isMultiplier) {
      cleaned = cleaned.slice(0, -1);
    }
    
    // Remove currency symbols and thousands separators
    cleaned = cleaned.replace(/[$€£¥,]/g, '');
    
    // Handle parentheses for negative numbers
    if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
      cleaned = '-' + cleaned.slice(1, -1);
    }
    
    const num = parseFloat(cleaned);
    if (isNaN(num)) return null;
    
    // Convert percentage to decimal for proper storage
    // Display code will multiply by 100 when showing
    if (isPercentage) {
      return num / 100;
    }
    
    return num;
  }

  /**
   * Find rows that look like header rows (contain multiple text column names)
   * Used for identifying tabular sections in mixed-format sheets
   */
  private findHeaderRows(allRows: string[][]): number[] {
    const headerIndices: number[] = [];
    
    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i];
      if (!row || row.length < 3) continue;
      
      // Count non-empty text cells that look like column headers
      let headerLikeCells = 0;
      let numericCells = 0;
      
      for (const cell of row) {
        if (!cell || !cell.trim()) continue;
        
        // Check if this cell looks like a header (text, not purely numeric)
        const trimmed = cell.trim();
        const isNumeric = this.parseNumericValue(trimmed) !== null;
        
        if (isNumeric) {
          numericCells++;
        } else if (trimmed.length > 1 && trimmed.length < 50) {
          // Text cell that's not too long - likely a header
          headerLikeCells++;
        }
      }
      
      // A header row should have multiple text headers and few/no numeric values
      // Typical patterns: "Property Name", "Property Type", "Market / MSA", etc.
      if (headerLikeCells >= 3 && numericCells <= 2) {
        headerIndices.push(i);
      }
    }
    
    return headerIndices;
  }

  /**
   * Save Google Sheets connection to database
   */
  async saveConnection(input: {
    fundId: string;
    dealId?: string | null;
    name: string;
    spreadsheetId: string;
    sheetName: string;
    accessToken: string;
    refreshToken: string;
    googleEmail: string;
    columnMapping: ColumnMapping[];
    syncFrequency: SyncFrequency;
    syncEnabled: boolean;
    now: Date;
  }): Promise<DataConnection> {
    const credentialsEncrypted = encryptCredentials(input.accessToken, input.refreshToken);
    const nextSyncAt = input.syncEnabled
      ? calculateNextSyncTime(input.syncFrequency, input.now)
      : null;

    const { data, error } = await supabaseAdmin
      .from('data_connections')
      .insert({
        fund_id: input.fundId,
        deal_id: input.dealId || null,
        provider: 'google_sheets',
        name: input.name,
        spreadsheet_id: input.spreadsheetId,
        sheet_name: input.sheetName,
        credentials_encrypted: credentialsEncrypted,
        column_mapping: input.columnMapping,
        google_email: input.googleEmail,
        sync_frequency: input.syncFrequency,
        sync_enabled: input.syncEnabled,
        next_sync_at: nextSyncAt?.toISOString() || null,
        sync_status: 'pending',
        created_at: input.now.toISOString(),
        updated_at: input.now.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving connection to database:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        input: {
          fundId: input.fundId,
          dealId: input.dealId,
          name: input.name,
          spreadsheetId: input.spreadsheetId,
          sheetName: input.sheetName,
          syncFrequency: input.syncFrequency,
          syncEnabled: input.syncEnabled,
          columnMappingCount: input.columnMapping?.length,
        },
      });
      throw new Error(`Failed to save connection: ${error.message || error.code || 'Database error'}`);
    }

    return this.formatConnection(data);
  }

  /**
   * Update connection sync settings
   */
  async updateSyncSettings(
    connectionId: string,
    syncFrequency: SyncFrequency,
    syncEnabled: boolean,
    now: Date
  ): Promise<DataConnection> {
    const nextSyncAt = syncEnabled ? calculateNextSyncTime(syncFrequency, now) : null;

    const { data, error } = await supabaseAdmin
      .from('data_connections')
      .update({
        sync_frequency: syncFrequency,
        sync_enabled: syncEnabled,
        next_sync_at: nextSyncAt?.toISOString() || null,
        updated_at: now.toISOString(),
      })
      .eq('id', connectionId)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update sync settings');
    }

    return this.formatConnection(data);
  }

  /**
   * Get connection by ID with decrypted credentials
   */
  async getConnectionWithCredentials(connectionId: string): Promise<GoogleSheetsConnection | null> {
    const { data, error } = await supabaseAdmin
      .from('data_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('provider', 'google_sheets')
      .single();

    if (error || !data) {
      return null;
    }

    if (!data.credentials_encrypted) {
      return null;
    }

    const { accessToken, refreshToken } = decryptCredentials(data.credentials_encrypted);

    return {
      id: data.id,
      fundId: data.fund_id,
      spreadsheetId: data.spreadsheet_id,
      sheetName: data.sheet_name,
      googleEmail: data.google_email,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Get connections due for sync
   */
  async getConnectionsDueForSync(now: Date): Promise<DataConnection[]> {
    const { data, error } = await supabaseAdmin
      .from('data_connections')
      .select('*')
      .eq('provider', 'google_sheets')
      .eq('sync_enabled', true)
      .lte('next_sync_at', now.toISOString())
      .order('next_sync_at', { ascending: true });

    if (error) {
      console.error('Error fetching connections due for sync:', error);
      return [];
    }

    return (data || []).map(this.formatConnection);
  }

  /**
   * Update sync status
   */
  async updateSyncStatus(
    connectionId: string,
    status: 'pending' | 'syncing' | 'success' | 'error',
    now: Date,
    options?: {
      syncError?: string | null;
      rowCount?: number;
      nextSyncAt?: Date | null;
    }
  ): Promise<void> {
    const updates: Record<string, unknown> = {
      sync_status: status,
      updated_at: now.toISOString(),
    };

    if (status === 'success') {
      updates.last_synced_at = now.toISOString();
      updates.sync_error = null;
      if (options?.rowCount !== undefined) {
        updates.last_sync_row_count = options.rowCount;
      }
    }

    if (status === 'error' && options?.syncError) {
      updates.sync_error = options.syncError;
    }

    if (options?.nextSyncAt !== undefined) {
      updates.next_sync_at = options.nextSyncAt?.toISOString() || null;
    }

    await supabaseAdmin.from('data_connections').update(updates).eq('id', connectionId);
  }

  /**
   * Disconnect Google Sheets (delete connection)
   */
  async disconnect(connectionId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('data_connections')
      .delete()
      .eq('id', connectionId)
      .eq('provider', 'google_sheets');

    if (error) {
      throw new Error('Failed to disconnect Google Sheets');
    }
  }

  /**
   * Get Google Sheets status for a fund
   * Returns connection status and whether we can reuse existing credentials
   */
  async getStatus(fundId: string): Promise<{
    connected: boolean;
    connections: DataConnection[];
    hasCredentials: boolean;
    googleEmail: string | null;
  }> {
    const { data, error } = await supabaseAdmin
      .from('data_connections')
      .select('*')
      .eq('fund_id', fundId)
      .eq('provider', 'google_sheets');

    if (error) {
      return { connected: false, connections: [], hasCredentials: false, googleEmail: null };
    }

    const connections = (data || []).map(this.formatConnection);
    
    // Check if any connection has valid credentials we can reuse
    const connectionWithCredentials = data?.find((c) => c.credentials_encrypted);
    
    return {
      connected: connections.length > 0,
      connections,
      hasCredentials: !!connectionWithCredentials,
      googleEmail: connectionWithCredentials?.google_email || null,
    };
  }

  /**
   * Get existing credentials for a fund (to reuse for new connections)
   */
  async getExistingCredentials(fundId: string): Promise<{
    accessToken: string;
    refreshToken: string;
    googleEmail: string;
  } | null> {
    const { data, error } = await supabaseAdmin
      .from('data_connections')
      .select('credentials_encrypted, google_email')
      .eq('fund_id', fundId)
      .eq('provider', 'google_sheets')
      .not('credentials_encrypted', 'is', null)
      .limit(1)
      .single();

    if (error || !data?.credentials_encrypted) {
      return null;
    }

    const { accessToken, refreshToken } = decryptCredentials(data.credentials_encrypted);
    return {
      accessToken,
      refreshToken,
      googleEmail: data.google_email || '',
    };
  }

  /**
   * List spreadsheets using existing fund credentials
   */
  async listSpreadsheetsWithExistingCredentials(fundId: string): Promise<SpreadsheetInfo[]> {
    const credentials = await this.getExistingCredentials(fundId);
    if (!credentials) {
      throw new Error('No existing Google credentials found. Please connect your account first.');
    }
    return this.listSpreadsheets(credentials.accessToken, credentials.refreshToken);
  }

  /**
   * Get sheets within a spreadsheet using existing fund credentials
   */
  async getSpreadsheetSheetsWithExistingCredentials(
    fundId: string,
    spreadsheetId: string
  ): Promise<SheetInfo[]> {
    const credentials = await this.getExistingCredentials(fundId);
    if (!credentials) {
      throw new Error('No existing Google credentials found. Please connect your account first.');
    }
    return this.getSpreadsheetSheets(
      credentials.accessToken,
      credentials.refreshToken,
      spreadsheetId
    );
  }

  /**
   * Preview sheet data using existing fund credentials
   */
  async previewSheetDataWithExistingCredentials(
    fundId: string,
    spreadsheetId: string,
    sheetName: string
  ): Promise<SheetPreview> {
    const credentials = await this.getExistingCredentials(fundId);
    if (!credentials) {
      throw new Error('No existing Google credentials found. Please connect your account first.');
    }
    return this.previewSheetData(
      credentials.accessToken,
      credentials.refreshToken,
      spreadsheetId,
      sheetName
    );
  }

  /**
   * Save connection using existing fund credentials
   */
  async saveConnectionWithExistingCredentials(
    fundId: string,
    input: {
      name: string;
      spreadsheetId: string;
      sheetName: string;
      columnMapping: ColumnMapping[];
      syncFrequency: SyncFrequency;
      syncEnabled: boolean;
      dealId?: string | null;
      dealMappingMode?: string;
      dealIdentifierColumn?: string;
      rowToDealMappings?: { rowIdentifier: string; dealId: string | null }[];
    }
  ): Promise<DataConnection> {
    const credentials = await this.getExistingCredentials(fundId);
    if (!credentials) {
      throw new Error('No existing Google credentials found. Please connect your account first.');
    }
    
    // Call saveConnection with properly formatted input
    return this.saveConnection({
      fundId,
      dealId: input.dealId || null,
      name: input.name,
      spreadsheetId: input.spreadsheetId,
      sheetName: input.sheetName,
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken,
      googleEmail: credentials.googleEmail,
      columnMapping: input.columnMapping,
      syncFrequency: input.syncFrequency,
      syncEnabled: input.syncEnabled,
      now: new Date(),
    });
  }

  private formatConnection(data: Record<string, unknown>): DataConnection {
    return {
      id: data.id as string,
      fundId: data.fund_id as string,
      dealId: data.deal_id as string | null,
      provider: data.provider as 'google_sheets' | 'excel',
      name: data.name as string,
      spreadsheetId: data.spreadsheet_id as string | null,
      sheetName: data.sheet_name as string | null,
      columnMapping: (data.column_mapping as ColumnMapping[]) || [],
      lastSyncedAt: data.last_synced_at as string | null,
      syncStatus: (data.sync_status as 'pending' | 'syncing' | 'success' | 'error') || 'pending',
      syncError: data.sync_error as string | null,
      syncFrequency: (data.sync_frequency as SyncFrequency) || 'manual',
      syncEnabled: (data.sync_enabled as boolean) || false,
      lastSyncRowCount: data.last_sync_row_count as number | null,
      nextSyncAt: data.next_sync_at as string | null,
      googleEmail: data.google_email as string | null,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
    };
  }
}

export const googleSheetsService = new GoogleSheetsService();
