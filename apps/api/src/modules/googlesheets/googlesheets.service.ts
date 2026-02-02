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
      
      // Get sample values from first few data rows
      const dataRows = values.slice(headerRowIdx + 1, Math.min(headerRowIdx + 4, section.endRow + 1));
      
      // Add each column header as a mappable metric
      for (const { name: header, colIdx } of headers) {
        // Find first non-empty sample value from data rows
        let sampleValue = '';
        for (const row of dataRows) {
          const val = String(row?.[colIdx] || '').trim();
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
   * Fetch all sheet data for sync
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
    
    // Create connection data in the same format as OAuth callback
    const connectionData = encryptCredentials(credentials.accessToken, credentials.refreshToken);
    
    return this.saveConnection(fundId, connectionData, credentials.googleEmail, input);
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
