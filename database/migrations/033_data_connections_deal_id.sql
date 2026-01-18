-- Add deal_id to data_connections table
-- This allows data connections to be associated with specific deals
-- Migration: 033_data_connections_deal_id.sql

-- ============================================
-- 1. Add deal_id column
-- ============================================
ALTER TABLE data_connections 
  ADD COLUMN deal_id UUID REFERENCES deals(id) ON DELETE SET NULL;

-- ============================================
-- 2. Create index for performance
-- ============================================
CREATE INDEX idx_data_connections_deal_id ON data_connections(deal_id);

-- ============================================
-- 3. Add comment for documentation
-- ============================================
COMMENT ON COLUMN data_connections.deal_id IS 'Optional reference to a specific deal. NULL means fund-level data.';









