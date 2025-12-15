-- Migration: Add image_url column to deals table
-- This allows deals to have a primary image for display instead of emoji icons

ALTER TABLE deals
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN deals.image_url IS 'URL to the primary image representing the deal, stored in Supabase Storage';

