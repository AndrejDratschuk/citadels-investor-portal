/**
 * Google Sheets Sync Scheduler
 * Internal scheduler that runs sync jobs at regular intervals
 */

import { googleSheetsService } from './googlesheets.service';
import { supabaseAdmin } from '../../common/database/supabase';

// ============================================
// Configuration
// ============================================
const SCHEDULER_INTERVAL_MS = 60 * 1000; // Check every 1 minute
let schedulerInterval: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

// ============================================
// Sync Logic
// ============================================
async function syncConnection(connectionId: string, now: Date): Promise<{
  success: boolean;
  rowCount?: number;
  error?: string;
}> {
  try {
    // Get full connection details
    const { data: connection, error: fetchError } = await supabaseAdmin
      .from('data_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (fetchError || !connection) {
      return { success: false, error: 'Connection not found' };
    }

    // Update status to syncing
    await supabaseAdmin
      .from('data_connections')
      .update({ sync_status: 'syncing' })
      .eq('id', connectionId);

    // Use the service's syncDataToKpi method
    const result = await googleSheetsService.syncDataToKpi(
      connectionId,
      connection.fund_id,
      connection.deal_id,
      connection.column_mapping || [],
      now
    );

    // Calculate next sync time
    const nextSyncAt = calculateNextSyncTime(connection.sync_frequency, now);

    // Update connection with success
    await supabaseAdmin
      .from('data_connections')
      .update({
        sync_status: 'success',
        sync_error: null,
        last_synced_at: now.toISOString(),
        last_sync_row_count: result.syncedCount,
        next_sync_at: nextSyncAt?.toISOString() || null,
      })
      .eq('id', connectionId);

    return { success: true, rowCount: result.syncedCount };
  } catch (err) {
    console.error(`[Scheduler] Sync error for connection ${connectionId}:`, err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown sync error';

    // Update connection with error
    await supabaseAdmin
      .from('data_connections')
      .update({
        sync_status: 'error',
        sync_error: errorMessage,
      })
      .eq('id', connectionId);

    return { success: false, error: errorMessage };
  }
}

function calculateNextSyncTime(frequency: string | null, now: Date): Date | null {
  if (!frequency || frequency === 'manual') return null;

  const minutes: Record<string, number> = {
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1h': 60,
    '6h': 360,
    '24h': 1440,
  };

  const mins = minutes[frequency];
  if (!mins) return null;

  const nextSync = new Date(now);
  nextSync.setMinutes(nextSync.getMinutes() + mins);
  return nextSync;
}

async function runScheduledSync(): Promise<void> {
  if (isRunning) {
    console.log('[Scheduler] Previous sync still running, skipping...');
    return;
  }

  isRunning = true;
  const now = new Date();

  try {
    // Get connections due for sync
    const { data: connections, error } = await supabaseAdmin
      .from('data_connections')
      .select('id, name, sync_frequency, next_sync_at, sync_enabled')
      .eq('sync_enabled', true)
      .neq('sync_frequency', 'manual')
      .or(`next_sync_at.is.null,next_sync_at.lte.${now.toISOString()}`);

    if (error) {
      console.error('[Scheduler] Error fetching connections:', error);
      return;
    }

    if (!connections || connections.length === 0) {
      // No connections due - this is normal, don't log every time
      return;
    }

    console.log(`[Scheduler] Found ${connections.length} connection(s) due for sync`);

    // Process each connection
    for (const conn of connections) {
      console.log(`[Scheduler] Syncing connection: ${conn.name} (${conn.id})`);
      const result = await syncConnection(conn.id, now);
      
      if (result.success) {
        console.log(`[Scheduler] ✓ Synced ${conn.name}: ${result.rowCount} rows`);
      } else {
        console.error(`[Scheduler] ✗ Failed ${conn.name}: ${result.error}`);
      }
    }
  } catch (err) {
    console.error('[Scheduler] Unexpected error:', err);
  } finally {
    isRunning = false;
  }
}

// ============================================
// Scheduler Control
// ============================================
export function startGoogleSheetsSyncScheduler(): void {
  if (schedulerInterval) {
    console.log('[Scheduler] Already running');
    return;
  }

  console.log('[Scheduler] Starting Google Sheets sync scheduler (every 1 minute)');
  
  // Run immediately on startup
  runScheduledSync();
  
  // Then run every minute
  schedulerInterval = setInterval(runScheduledSync, SCHEDULER_INTERVAL_MS);
}

export function stopGoogleSheetsSyncScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[Scheduler] Stopped Google Sheets sync scheduler');
  }
}

// Export for testing
export { runScheduledSync };
