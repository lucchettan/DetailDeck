-- Configure service-images bucket to accept HEIC files
-- This script updates the bucket configuration to accept HEIC/HEIF files

-- Update the service-images bucket to accept HEIC files
UPDATE storage.buckets
SET
  file_size_limit = 10485760, -- 10MB
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]
WHERE id = 'service-images';

-- If the bucket doesn't exist, create it
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-images',
  'service-images',
  true,
  10485760, -- 10MB
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ];

-- Ensure RLS policies are in place
DROP POLICY IF EXISTS "Authenticated users can upload service images" ON storage.objects;
DROP POLICY IF EXISTS "Service images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete service images" ON storage.objects;

CREATE POLICY "Authenticated users can upload service images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'service-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Service images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'service-images');

CREATE POLICY "Authenticated users can delete service images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'service-images' AND
  auth.role() = 'authenticated'
);

-- Verify the configuration
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'service-images';
