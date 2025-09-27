-- Migration pour ajouter le support des images multiples aux services
-- Ajouter la colonne image_urls (array de text) à la table services

ALTER TABLE services
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Optionnel: migrer les données existantes de image_url vers image_urls
-- Si une image_url existe, la convertir en array
UPDATE services
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL AND image_url != '' AND (image_urls IS NULL OR array_length(image_urls, 1) IS NULL);

-- Commentaire sur la colonne
COMMENT ON COLUMN services.image_urls IS 'Array of image URLs for the service (max 4 images)';
