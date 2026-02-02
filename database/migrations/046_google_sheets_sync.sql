-- Google Sheets Live Sync Configuration
-- Migration: 046_google_sheets_sync.sql

-- ============================================
-- 1. Add sheet_name column for specific sheet selection
-- ============================================
ALTER TABLE data_connections ADD COLUMN IF NOT EXISTS sheet_name TEXT;

-- ============================================
-- 2. Add sync frequency configuration
-- ============================================
ALTER TABLE data_connections ADD COLUMN IF NOT EXISTS sync_frequency TEXT DEFAULT 'manual'
  CHECK (sync_frequency IN ('5m', '15m', '30m', '1h', '6h', '24h', 'manual'));

-- ============================================
-- 3. Add sync enabled flag
-- ============================================
ALTER TABLE data_connections ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT FALSE;

-- ============================================
-- 4. Add last sync row count for tracking
-- ============================================
ALTER TABLE data_connections ADD COLUMN IF NOT EXISTS last_sync_row_count INT;

-- ============================================
-- 5. Add next scheduled sync time
-- ============================================
ALTER TABLE data_connections ADD COLUMN IF NOT EXISTS next_sync_at TIMESTAMPTZ;

-- ============================================
-- 6. Add Google account email for display
-- ============================================
ALTER TABLE data_connections ADD COLUMN IF NOT EXISTS google_email TEXT;

-- ============================================
-- 7. Create index for sync queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_data_connections_sync_enabled 
  ON data_connections(sync_enabled, next_sync_at) 
  WHERE sync_enabled = TRUE;

-- ============================================
-- 8. Add comments for documentation
-- ============================================
COMMENT ON COLUMN data_connections.sheet_name IS 'Name of the specific sheet within the spreadsheet';
COMMENT ON COLUMN data_connections.sync_frequency IS 'How often to sync: 5m, 15m, 30m, 1h, 6h, 24h, or manual';
COMMENT ON COLUMN data_connections.sync_enabled IS 'Whether automatic syncing is enabled';
COMMENT ON COLUMN data_connections.last_sync_row_count IS 'Number of rows synced in last sync operation';
COMMENT ON COLUMN data_connections.next_sync_at IS 'Next scheduled sync time based on frequency';
COMMENT ON COLUMN data_connections.google_email IS 'Email of connected Google account';
