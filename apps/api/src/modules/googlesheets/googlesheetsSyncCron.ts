/**
 * Google Sheets Sync Cron
 * HTTP endpoint for triggering scheduled sync of Google Sheets connections
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { googleSheetsService } from './googlesheets.service';
import { supabaseAdmin } from '../../common/database/supabase';
import type { SyncFrequency } from '@altsui/shared';

// ============================================
// Types
// ============================================
interface SyncResult {
  connectionId: string;
  success: boolean;
  rowCount?: number;
  error?: string;
}

// ============================================
// Helper Functions
// ============================================
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

/**
 * Process sheet data with column mappings and update KPI data
 */
async function processSheetDataWithMapping(
  connectionId: string,
  fundId: string,
  dealId: string | null,
  headers: string[],
  rows: string[][],
  columnMapping: Array<{ columnName: string; kpiCode: string; dataType: string }>,
  now: Date
): Promise<number> {
  // Build header index map for faster lookup
  const headerIndex = new Map<string, number>();
  headers.forEach((header, index) => {
    headerIndex.set(header.toLowerCase().trim(), index);
  });

  // Process each row
  let processedCount = 0;

  for (const row of rows) {
    // Skip empty rows
    if (row.every((cell) => !cell || cell.trim() === '')) {
      continue;
    }

    // Extract mapped values
    for (const mapping of columnMapping) {
      const colIndex = headerIndex.get(mapping.columnName.toLowerCase().trim());
      if (colIndex === undefined) continue;

      const rawValue = row[colIndex];
      if (!rawValue || rawValue.trim() === '') continue;

      // Parse value based on data type
      let parsedValue: number | string | boolean | null = null;
      switch (mapping.dataType) {
        case 'number':
        case 'currency':
        case 'percentage':
          // Remove common formatting characters
          const numStr = rawValue.replace(/[$,%,]/g, '').trim();
          parsedValue = parseFloat(numStr);
          if (isNaN(parsedValue)) parsedValue = null;
          break;
        case 'boolean':
          parsedValue = ['true', 'yes', '1'].includes(rawValue.toLowerCase().trim());
          break;
        case 'text':
        default:
          parsedValue = rawValue.trim();
          break;
      }

      if (parsedValue === null) continue;

      // Upsert KPI data
      // For simplicity, using the row index as a period identifier
      const period = now.toISOString().slice(0, 7); // YYYY-MM format

      await supabaseAdmin.from('kpi_data').upsert(
        {
          fund_id: fundId,
          deal_id: dealId,
          kpi_code: mapping.kpiCode,
          period,
          value: typeof parsedValue === 'string' ? parsedValue : parsedValue.toString(),
          data_connection_id: connectionId,
          updated_at: now.toISOString(),
        },
        {
          onConflict: 'fund_id,deal_id,kpi_code,period',
        }
      );

      processedCount++;
    }
  }

  return processedCount;
}

/**
 * Sync a single connection
 */
async function syncConnection(connectionId: string, now: Date): Promise<SyncResult> {
  try {
    // Get connection with credentials
    const connection = await googleSheetsService.getConnectionWithCredentials(connectionId);
    if (!connection) {
      return { connectionId, success: false, error: 'Connection not found' };
    }

    // Update status to syncing
    await googleSheetsService.updateSyncStatus(connectionId, 'syncing', now);

    // Fetch sheet data
    const { headers, rows } = await googleSheetsService.fetchSheetData(
      connection.accessToken,
      connection.refreshToken,
      connection.spreadsheetId,
      connection.sheetName
    );

    // Get full connection data for mapping info
    const { data: fullConnection } = await supabaseAdmin
      .from('data_connections')
      .select('fund_id, deal_id, column_mapping, sync_frequency')
      .eq('id', connectionId)
      .single();

    if (!fullConnection) {
      return { connectionId, success: false, error: 'Connection data not found' };
    }

    // Process data with column mapping
    await processSheetDataWithMapping(
      connectionId,
      fullConnection.fund_id,
      fullConnection.deal_id,
      headers,
      rows,
      fullConnection.column_mapping || [],
      now
    );

    // Calculate next sync time
    const nextSyncAt = calculateNextSyncTime(fullConnection.sync_frequency, now);

    // Update status to success
    await googleSheetsService.updateSyncStatus(connectionId, 'success', now, {
      rowCount: rows.length,
      nextSyncAt,
    });

    return { connectionId, success: true, rowCount: rows.length };
  } catch (err) {
    console.error(`Sync error for connection ${connectionId}:`, err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown sync error';

    // Update status to error
    await googleSheetsService.updateSyncStatus(connectionId, 'error', now, {
      syncError: errorMessage,
    });

    return { connectionId, success: false, error: errorMessage };
  }
}

// ============================================
// Route Handler
// ============================================
export async function googleSheetsSyncCronRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * Admin endpoint to run sync cron job
   * Called by external scheduler (e.g., Railway cron, Vercel cron)
   */
  fastify.post(
    '/admin/run-google-sheets-sync',
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      // Verify admin API key
      const apiKey = request.headers['x-admin-api-key'];
      const expectedKey = process.env.ADMIN_API_KEY;

      if (!expectedKey || apiKey !== expectedKey) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const now = new Date();

      // Get connections due for sync
      const connectionsDue = await googleSheetsService.getConnectionsDueForSync(now);

      if (connectionsDue.length === 0) {
        return reply.send({
          success: true,
          message: 'No connections due for sync',
          processed: 0,
        });
      }

      // Process each connection
      const results: SyncResult[] = [];
      for (const connection of connectionsDue) {
        const result = await syncConnection(connection.id, now);
        results.push(result);
      }

      const successCount = results.filter((r) => r.success).length;
      const errorCount = results.filter((r) => !r.success).length;

      return reply.send({
        success: true,
        processed: results.length,
        successful: successCount,
        failed: errorCount,
        results,
      });
    }
  );

  /**
   * Manual sync trigger for a specific connection
   * Used for testing or on-demand sync
   */
  fastify.post(
    '/admin/sync-connection/:connectionId',
    async (
      request: FastifyRequest<{ Params: { connectionId: string } }>,
      reply: FastifyReply
    ): Promise<void> => {
      // Verify admin API key
      const apiKey = request.headers['x-admin-api-key'];
      const expectedKey = process.env.ADMIN_API_KEY;

      if (!expectedKey || apiKey !== expectedKey) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { connectionId } = request.params;
      const now = new Date();

      const result = await syncConnection(connectionId, now);

      if (result.success) {
        return reply.send({
          success: true,
          connectionId,
          rowCount: result.rowCount,
        });
      } else {
        return reply.status(500).send({
          success: false,
          connectionId,
          error: result.error,
        });
      }
    }
  );
}
