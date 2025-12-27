-- Migration: Add tax_id_number column to investors table
-- Description: Stores the full SSN/EIN number (to be encrypted later)

-- Add tax_id_number column to store full SSN/EIN
ALTER TABLE investors
ADD COLUMN IF NOT EXISTS tax_id_number TEXT;

-- Add comment for documentation
COMMENT ON COLUMN investors.tax_id_number IS 'Full SSN/EIN number (TODO: encrypt this field)';

