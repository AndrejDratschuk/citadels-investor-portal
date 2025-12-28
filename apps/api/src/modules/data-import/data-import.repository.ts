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
  provider: string;
  name: string;
  credentials_encrypted: string | null;
  spreadsheet_id: string | null;
  column_mapping: ColumnMapping[];
  last_synced_at: string | null;
  sync_status: string;
  sync_error: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Repository Class
// ============================================
export class DataImportRepository {
  // ========== Data Connections ==========

  async getConnectionsByFundId(fundId: string): Promise<DataConnection[]> {
    const { data, error } = await supabaseAdmin
      .from('data_connections')
      .select('*')
      .eq('fund_id', fundId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching data connections:', error);
      throw new Error('Failed to fetch data connections');
    }

    return data.map(this.formatConnection);
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
    provider: DataConnectionProvider;
    name: string;
    spreadsheetId?: string;
    credentialsEncrypted?: string;
  }): Promise<DataConnection> {
    const { data, error } = await supabaseAdmin
      .from('data_connections')
      .insert({
        fund_id: input.fundId,
        provider: input.provider,
        name: input.name,
        spreadsheet_id: input.spreadsheetId || null,
        credentials_encrypted: input.credentialsEncrypted || null,
        column_mapping: [],
        sync_status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating data connection:', error);
      throw new Error('Failed to create data connection');
    }

    return this.formatConnection(data);
  }

  async updateConnection(
    id: string,
    updates: Partial<{
      name: string;
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
      .select()
      .single();

    if (error) {
      console.error('Error updating data connection:', error);
      throw new Error('Failed to update data connection');
    }

    return this.formatConnection(data);
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
      provider: row.provider as DataConnectionProvider,
      name: row.name,
      spreadsheetId: row.spreadsheet_id,
      columnMapping: row.column_mapping || [],
      lastSyncedAt: row.last_synced_at,
      syncStatus: row.sync_status as SyncStatus,
      syncError: row.sync_error,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const dataImportRepository = new DataImportRepository();

