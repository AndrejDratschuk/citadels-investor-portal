-- Migration: Create storage bucket for deal images
-- This bucket stores the primary images for each deal

-- Create the deal-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deal-images',
  'deal-images',
  true, -- public bucket so images can be displayed
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to deal-images bucket
CREATE POLICY "Authenticated users can upload deal images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'deal-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update deal images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'deal-images');

-- Allow authenticated users to delete deal images
CREATE POLICY "Authenticated users can delete deal images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'deal-images');

-- Allow public read access to deal images
CREATE POLICY "Public can view deal images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'deal-images');

