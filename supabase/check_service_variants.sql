-- Vérification de la table service_variants
-- À exécuter dans Supabase SQL Editor

-- 1. Contenu de service_variants
SELECT
    'service_variants_count' as check_type,
    COUNT(*) as count
FROM service_variants;

-- 2. Exemple de données dans service_variants (si il y en a)
SELECT
    'service_variants_sample' as check_type,
    sv.service_id,
    s.name as service_name,
    sv.size,
    sv.price,
    sv.duration_minutes
FROM service_variants sv
LEFT JOIN services s ON s.id = sv.service_id
LIMIT 5;

-- 3. Comparaison avec service_vehicle_size_supplements
SELECT
    'supplements_count' as check_type,
    COUNT(*) as count
FROM service_vehicle_size_supplements;

-- 4. Exemple de données dans supplements
SELECT
    'supplements_sample' as check_type,
    svss.service_id,
    s.name as service_name,
    svss.size as old_size,
    svs.name as new_size_name,
    svss.additional_price,
    svss.additional_duration
FROM service_vehicle_size_supplements svss
LEFT JOIN services s ON s.id = svss.service_id
LEFT JOIN shop_vehicle_sizes svs ON svs.id = svss.vehicle_size_id
LIMIT 5;

-- 5. Vérifier si service_variants est référencée ailleurs
SELECT
    'foreign_keys_to_service_variants' as check_type,
    tc.table_name,
    ku.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ku.referenced_table_name = 'service_variants';

