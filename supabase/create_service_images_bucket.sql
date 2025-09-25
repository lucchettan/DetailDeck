-- Créer le bucket pour les images de services
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-images',
  'service-images',
  true,
  5242880, -- 5MB en bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Créer la politique RLS pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload service images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'service-images' AND
  auth.role() = 'authenticated'
);

-- Créer la politique RLS pour permettre la lecture publique
CREATE POLICY "Service images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'service-images');

-- Créer la politique RLS pour permettre la suppression aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can delete service images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'service-images' AND
  auth.role() = 'authenticated'
);
