-- ============================================
-- Migration: 049_fix_sync_scheduling.sql
-- Description: Fix existing connections to have proper sync scheduling
-- ============================================

-- Enable sync for all connections that have a frequency other than manual
UPDATE data_connections
SET sync_enabled = true
WHERE sync_frequency IS NOT NULL 
  AND sync_frequency != 'manual'
  AND (sync_enabled IS NULL OR sync_enabled = false);

-- Set next_sync_at to now for connections that need to sync but don't have a next_sync_at
UPDATE data_connections
SET next_sync_at = NOW()
WHERE sync_frequency IS NOT NULL 
  AND sync_frequency != 'manual'
  AND sync_enabled = true
  AND next_sync_at IS NULL;

-- Log what was updated
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count 
    FROM data_connections 
    WHERE sync_enabled = true 
      AND sync_frequency != 'manual';
    
    RAISE NOTICE 'Connections with auto-sync enabled: %', updated_count;
END $$;
