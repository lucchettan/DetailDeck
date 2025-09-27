-- Script pour déboguer la table services
-- Vérifier la structure de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'services'
ORDER BY ordinal_position;

-- Vérifier les données existantes
SELECT id, name, description, category_id, base_price, base_duration, is_active, image_urls, created_at
FROM services
LIMIT 5;

-- Vérifier les contraintes
SELECT constraint_name, constraint_type, column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'services';




