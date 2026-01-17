-- Migration: Add actual_start_date for Planned vs Actual milestone comparison
-- This enables tracking when work actually began vs planned start date

-- ============================================
-- 1. Add actual_start_date column
-- ============================================
ALTER TABLE deal_milestones 
  ADD COLUMN IF NOT EXISTS actual_start_date DATE;

-- ============================================
-- 2. Add documentation comments
-- ============================================
COMMENT ON COLUMN deal_milestones.actual_start_date IS 'When work actually began (for planned vs actual comparison)';
COMMENT ON COLUMN deal_milestones.actual_completion_date IS 'When work actually completed or is expected to complete';

-- ============================================
-- 3. Create index for querying by actual dates
-- ============================================
CREATE INDEX IF NOT EXISTS idx_deal_milestones_actual_start 
  ON deal_milestones(actual_start_date) 
  WHERE actual_start_date IS NOT NULL;

