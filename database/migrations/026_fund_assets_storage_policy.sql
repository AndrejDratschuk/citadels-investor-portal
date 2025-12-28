-- Migration: Add storage policies for fund-assets bucket
-- This allows authenticated users to upload documents to the fund-assets bucket

-- Create the fund-assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fund-assets',
  'fund-assets',
  true, -- public bucket so documents can be accessed
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload fund assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update fund assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete fund assets" ON storage.objects;
DROP POLICY IF EXISTS "Public can view fund assets" ON storage.objects;

-- Allow authenticated users to upload to fund-assets bucket
CREATE POLICY "Authenticated users can upload fund assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'fund-assets');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update fund assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'fund-assets');

-- Allow authenticated users to delete fund assets
CREATE POLICY "Authenticated users can delete fund assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'fund-assets');

-- Allow public read access to fund assets (so documents can be downloaded)
CREATE POLICY "Public can view fund assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'fund-assets');

