-- Script de nettoyage de la DB pour la mise en live
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier que les nouvelles colonnes sont bien utilisées
SELECT
    'services with old category' as check_type,
    COUNT(*) as count
FROM services
WHERE category_id IS NULL AND category IS NOT NULL

UNION ALL

SELECT
    'supplements with old size' as check_type,
    COUNT(*) as count
FROM service_vehicle_size_supplements
WHERE vehicle_size_id IS NULL AND size IS NOT NULL

UNION ALL

SELECT
    'services with both category fields' as check_type,
    COUNT(*) as count
FROM services
WHERE category_id IS NOT NULL AND category IS NOT NULL

UNION ALL

SELECT
    'supplements with both size fields' as check_type,
    COUNT(*) as count
FROM service_vehicle_size_supplements
WHERE vehicle_size_id IS NOT NULL AND size IS NOT NULL;

-- 2. Migration finale des données restantes (si nécessaire)
DO $$
BEGIN
    -- Migrer les services qui n'ont que l'ancienne colonne category
    UPDATE services
    SET category_id = (
        SELECT id FROM shop_service_categories
        WHERE shop_service_categories.shop_id = services.shop_id
        AND LOWER(shop_service_categories.name) = LOWER(services.category)
        LIMIT 1
    )
    WHERE category_id IS NULL
    AND category IS NOT NULL;

    -- Migrer les supplements qui n'ont que l'ancienne colonne size
    UPDATE service_vehicle_size_supplements
    SET vehicle_size_id = (
        SELECT svs.id
        FROM shop_vehicle_sizes svs
        JOIN services s ON s.shop_id = svs.shop_id
        WHERE s.id = service_vehicle_size_supplements.service_id
        AND LOWER(svs.name) = LOWER(service_vehicle_size_supplements.size)
        LIMIT 1
    )
    WHERE vehicle_size_id IS NULL
    AND size IS NOT NULL;
END $$;

-- 3. Supprimer les colonnes obsolètes (ATTENTION: Sauvegarde avant!)
-- ALTER TABLE services DROP COLUMN IF EXISTS category;
-- ALTER TABLE service_vehicle_size_supplements DROP COLUMN IF EXISTS size;
-- ALTER TABLE shops DROP COLUMN IF EXISTS supported_vehicle_sizes;

-- 4. Supprimer la table orpheline service_variants (si elle n'est pas utilisée)
-- DROP TABLE IF EXISTS service_variants;

-- 5. Vérification finale
SELECT
    'Final check - services without category_id' as check_type,
    COUNT(*) as count
FROM services
WHERE category_id IS NULL

UNION ALL

SELECT
    'Final check - supplements without vehicle_size_id' as check_type,
    COUNT(*) as count
FROM service_vehicle_size_supplements
WHERE vehicle_size_id IS NULL;

