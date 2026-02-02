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
   * Preview sheet data (first N rows)
   */
  async previewSheetData(
    accessToken: string,
    refreshToken: string,
    spreadsheetId: string,
    sheetName: string,
    maxRows: number = 10
  ): Promise<SheetPreview> {
    const auth = await this.getAuthenticatedClient(accessToken, refreshToken);
    const sheets = google.sheets({ version: 'v4', auth });

    // Get all data to count rows, but only return preview
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'`,
    });

    const values = response.data.values || [];
    const headers = values[0] || [];
    const dataRows = values.slice(1);

    return {
      headers: headers.map(String),
      rows: dataRows.slice(0, maxRows).map((row) => row.map(String)),
      totalRows: dataRows.length,
    };
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
      console.error('Error saving connection:', error);
      throw new Error('Failed to save Google Sheets connection');
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
   */
  async getStatus(fundId: string): Promise<{
    connected: boolean;
    connections: DataConnection[];
  }> {
    const { data, error } = await supabaseAdmin
      .from('data_connections')
      .select('*')
      .eq('fund_id', fundId)
      .eq('provider', 'google_sheets');

    if (error) {
      return { connected: false, connections: [] };
    }

    const connections = (data || []).map(this.formatConnection);
    return {
      connected: connections.length > 0,
      connections,
    };
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
