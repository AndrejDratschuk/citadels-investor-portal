-- Migration: Team Management Email Fields (Stage 07)
-- Adds fields needed for team management and internal notification emails

-- Add capital call summary frequency to funds table
-- Controls how often managers receive capital call summary emails
ALTER TABLE funds 
ADD COLUMN IF NOT EXISTS capital_call_summary_frequency TEXT 
DEFAULT 'daily' 
CHECK (capital_call_summary_frequency IN ('daily', 'weekly', 'none'));

-- Add platform_name to funds table if not exists (used in team invite emails)
ALTER TABLE funds 
ADD COLUMN IF NOT EXISTS platform_name TEXT;

-- Add call_number to capital_calls for tracking which capital call this is
ALTER TABLE capital_calls 
ADD COLUMN IF NOT EXISTS call_number INTEGER;

-- Update existing capital calls to have sequential call numbers per fund/deal
WITH numbered_calls AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY fund_id, deal_id ORDER BY created_at) as row_num
  FROM capital_calls
)
UPDATE capital_calls
SET call_number = numbered_calls.row_num
FROM numbered_calls
WHERE capital_calls.id = numbered_calls.id
AND capital_calls.call_number IS NULL;

-- Set default call_number for future inserts
ALTER TABLE capital_calls 
ALTER COLUMN call_number SET DEFAULT 1;

COMMENT ON COLUMN funds.capital_call_summary_frequency IS 'How often to send capital call summary emails: daily, weekly, or none';
COMMENT ON COLUMN funds.platform_name IS 'White-label platform name used in emails (defaults to Altsui)';
COMMENT ON COLUMN capital_calls.call_number IS 'Sequential number for this capital call within the fund/deal';
