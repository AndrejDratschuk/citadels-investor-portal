/**
 * Data Import Repository
 * Handles data connections CRUD operations
 */

import { supabaseAdmin } from '../../common/database/supabase';
import type {
  DataConnection,
  DataConnectionProvider,
  SyncStatus,
  ColumnMapping,
} from '@altsui/shared';

// ============================================
// Database Row Types (snake_case)
// ============================================
interface DataConnectionRow {
  id: string;
  fund_id: string;
  deal_id: string | null;
  provider: string;
  name: string;
  credentials_encrypted: string | null;
  spreadsheet_id: string | null;
  sheet_name: string | null;
  column_mapping: ColumnMapping[];
  last_synced_at: string | null;
  sync_status: string;
  sync_error: string | null;
  sync_frequency: string | null;
  sync_enabled: boolean | null;
  last_sync_row_count: number | null;
  next_sync_at: string | null;
  google_email: string | null;
  created_at: string;
  updated_at: string;
}

// Extended row when joining with deals
interface DataConnectionWithDealRow extends DataConnectionRow {
  deals?: { name: string } | null;
}

// ============================================
// Repository Class
// ============================================
export class DataImportRepository {
  // ========== Data Connections ==========

  async getConnectionsByFundId(fundId: string): Promise<DataConnection[]> {
    // First try with deal join, fallback to basic query if relationship doesn't exist
    const { data, error } = await supabaseAdmin
      .from('data_connections')
      .select('*')
      .eq('fund_id', fundId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching data connections:', error);
      throw new Error('Failed to fetch data connections');
    }

    // Map connections and fetch deal names separately if deal_id exists
    const connections = await Promise.all(
      data.map(async (row) => {
        const connection = this.formatConnection(row as DataConnectionRow);
        // Try to fetch deal name if deal_id exists
        if (row.deal_id) {
          const { data: deal } = await supabaseAdmin
            .from('deals')
            .select('name')
            .eq('id', row.deal_id)
            .single();
          if (deal) {
            return { ...connection, dealName: deal.name };
          }
        }
        return connection;
      })
    );

    return connections;
  }

  async getConnectionsByDealId(dealId: string): Promise<DataConnection[]> {
    const { data, error } = await supabaseAdmin
      .from('data_connections')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching data connections by deal:', error);
      throw new Error('Failed to fetch data connections');
    }

    // Fetch the deal name once for all connections
    const { data: deal } = await supabaseAdmin
      .from('deals')
      .select('name')
      .eq('id', dealId)
      .single();

    return data.map((row) => ({
      ...this.formatConnection(row as DataConnectionRow),
      dealName: deal?.name,
    }));
  }

  async getConnectionById(id: string): Promise<DataConnection | null> {
    const { data, error } = await supabaseAdmin
      .from('data_connections')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return this.formatConnection(data);
  }

  async createConnection(input: {
    fundId: string;
    dealId?: string | null;
    provider: DataConnectionProvider;
    name: string;
    spreadsheetId?: string;
    credentialsEncrypted?: string;
    columnMapping?: Array<{ columnName: string; kpiCode: string; dataType: string }>;
  }): Promise<DataConnection> {
    // Build insert object - only include deal_id if it's provided
    // This handles both when the column exists and when it doesn't
    const insertData: Record<string, unknown> = {
      fund_id: input.fundId,
      provider: input.provider,
      name: input.name,
      spreadsheet_id: input.spreadsheetId || null,
      credentials_encrypted: input.credentialsEncrypted || null,
      column_mapping: input.columnMapping || [],
      sync_status: 'pending',
    };

    // Only add deal_id if provided (to support schemas with/without the column)
    if (input.dealId !== undefined) {
      insertData.deal_id = input.dealId || null;
    }

    const { data, error } = await supabaseAdmin
      .from('data_connections')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      console.error('Error creating data connection:', error);
      console.error('Insert data was:', JSON.stringify(insertData, null, 2));
      throw new Error('Failed to create data connection');
    }

    const connection = this.formatConnection(data as DataConnectionRow);

    // Fetch deal name separately if deal_id exists
    if (input.dealId) {
      const { data: deal } = await supabaseAdmin
        .from('deals')
        .select('name')
        .eq('id', input.dealId)
        .single();
      if (deal) {
        return { ...connection, dealName: deal.name };
      }
    }

    return connection;
  }

  async updateConnection(
    id: string,
    updates: Partial<{
      name: string;
      dealId: string | null;
      spreadsheetId: string;
      credentialsEncrypted: string;
      columnMapping: ColumnMapping[];
      syncStatus: SyncStatus;
      syncError: string | null;
      lastSyncedAt: string;
    }>
  ): Promise<DataConnection> {
    const updateData: Record<string, unknown> = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.dealId !== undefined) updateData.deal_id = updates.dealId;
    if (updates.spreadsheetId !== undefined) updateData.spreadsheet_id = updates.spreadsheetId;
    if (updates.credentialsEncrypted !== undefined)
      updateData.credentials_encrypted = updates.credentialsEncrypted;
    if (updates.columnMapping !== undefined) updateData.column_mapping = updates.columnMapping;
    if (updates.syncStatus !== undefined) updateData.sync_status = updates.syncStatus;
    if (updates.syncError !== undefined) updateData.sync_error = updates.syncError;
    if (updates.lastSyncedAt !== undefined) updateData.last_synced_at = updates.lastSyncedAt;

    const { data, error } = await supabaseAdmin
      .from('data_connections')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating data connection:', error);
      throw new Error('Failed to update data connection');
    }

    const connection = this.formatConnection(data as DataConnectionRow);

    // Fetch deal name separately if deal_id exists
    if (data.deal_id) {
      const { data: deal } = await supabaseAdmin
        .from('deals')
        .select('name')
        .eq('id', data.deal_id)
        .single();
      if (deal) {
        return { ...connection, dealName: deal.name };
      }
    }

    return connection;
  }

  async updateConnectionDeal(connectionId: string, dealId: string | null): Promise<DataConnection> {
    const { data, error } = await supabaseAdmin
      .from('data_connections')
      .update({ deal_id: dealId })
      .eq('id', connectionId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating connection deal:', error);
      throw new Error('Failed to update connection deal');
    }

    const connection = this.formatConnection(data as DataConnectionRow);

    // Fetch deal name separately if deal_id exists
    if (dealId) {
      const { data: deal } = await supabaseAdmin
        .from('deals')
        .select('name')
        .eq('id', dealId)
        .single();
      if (deal) {
        return { ...connection, dealName: deal.name };
      }
    }

    return connection;
  }

  async deleteConnection(id: string): Promise<void> {
    const { error } = await supabaseAdmin.from('data_connections').delete().eq('id', id);

    if (error) {
      console.error('Error deleting data connection:', error);
      throw new Error('Failed to delete data connection');
    }
  }

  // ========== Formatting ==========

  private formatConnection(row: DataConnectionRow): DataConnection {
    return {
      id: row.id,
      fundId: row.fund_id,
      dealId: row.deal_id,
      provider: row.provider as DataConnectionProvider,
      name: row.name,
      spreadsheetId: row.spreadsheet_id,
      sheetName: row.sheet_name,
      columnMapping: row.column_mapping || [],
      lastSyncedAt: row.last_synced_at,
      syncStatus: row.sync_status as SyncStatus,
      syncError: row.sync_error,
      syncFrequency: (row.sync_frequency as 'manual' | '5m' | '15m' | '30m' | '1h' | '6h' | '24h') || 'manual',
      syncEnabled: row.sync_enabled || false,
      lastSyncRowCount: row.last_sync_row_count,
      nextSyncAt: row.next_sync_at,
      googleEmail: row.google_email,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private formatConnectionWithDeal(row: DataConnectionWithDealRow): DataConnection {
    return {
      id: row.id,
      fundId: row.fund_id,
      dealId: row.deal_id,
      dealName: row.deals?.name ?? undefined,
      provider: row.provider as DataConnectionProvider,
      name: row.name,
      spreadsheetId: row.spreadsheet_id,
      sheetName: row.sheet_name,
      columnMapping: row.column_mapping || [],
      lastSyncedAt: row.last_synced_at,
      syncStatus: row.sync_status as SyncStatus,
      syncError: row.sync_error,
      syncFrequency: (row.sync_frequency as 'manual' | '5m' | '15m' | '30m' | '1h' | '6h' | '24h') || 'manual',
      syncEnabled: row.sync_enabled || false,
      lastSyncRowCount: row.last_sync_row_count,
      nextSyncAt: row.next_sync_at,
      googleEmail: row.google_email,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const dataImportRepository = new DataImportRepository();

