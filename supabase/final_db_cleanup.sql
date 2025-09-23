-- Script de nettoyage final pour la mise en live
-- À exécuter étape par étape dans Supabase SQL Editor

-- ========================================
-- ÉTAPE 1: DIAGNOSTIC COMPLET
-- ========================================

-- 1.1 Vérifier l'état actuel des migrations
SELECT
    'services_with_old_category' as check_type,
    COUNT(*) as count,
    'Services qui ont encore l''ancienne colonne category remplie' as description
FROM services
WHERE category IS NOT NULL AND category != ''

UNION ALL

SELECT
    'services_with_new_category_id' as check_type,
    COUNT(*) as count,
    'Services qui utilisent la nouvelle colonne category_id' as description
FROM services
WHERE category_id IS NOT NULL

UNION ALL

SELECT
    'supplements_with_old_size' as check_type,
    COUNT(*) as count,
    'Supplements qui ont encore l''ancienne colonne size' as description
FROM service_vehicle_size_supplements
WHERE size IS NOT NULL AND size != ''

UNION ALL

SELECT
    'supplements_with_new_vehicle_size_id' as check_type,
    COUNT(*) as count,
    'Supplements qui utilisent la nouvelle colonne vehicle_size_id' as description
FROM service_vehicle_size_supplements
WHERE vehicle_size_id IS NOT NULL

UNION ALL

SELECT
    'service_variants_count' as check_type,
    COUNT(*) as count,
    'Nombre d''entrées dans service_variants (à vérifier si orpheline)' as description
FROM service_variants;

-- 1.2 Exemple de données dans service_variants
SELECT
    'service_variants_sample' as type,
    COALESCE(s.name, 'Service supprimé') as service_name,
    sv.size,
    sv.price,
    sv.duration_minutes
FROM service_variants sv
LEFT JOIN services s ON s.id = sv.service_id
LIMIT 3;

-- ========================================
-- ÉTAPE 2: MIGRATION FINALE DES DONNÉES
-- ========================================

-- 2.1 Migrer les services restants vers category_id
DO $$
BEGIN
    -- Migrer les services qui n'ont que l'ancienne colonne category
    UPDATE services
    SET category_id = (
        SELECT ssc.id
        FROM shop_service_categories ssc
        WHERE ssc.shop_id = services.shop_id
        AND (
            (services.category = 'interior' AND LOWER(ssc.name) LIKE '%interior%') OR
            (services.category = 'exterior' AND LOWER(ssc.name) LIKE '%exterior%') OR
            (services.category = 'complementary' AND LOWER(ssc.name) LIKE '%exterior%')
        )
        LIMIT 1
    )
    WHERE category_id IS NULL
    AND category IS NOT NULL;

    RAISE NOTICE 'Migration des catégories de services terminée';
END $$;

-- 2.2 Migrer les supplements restants vers vehicle_size_id
DO $$
BEGIN
    UPDATE service_vehicle_size_supplements
    SET vehicle_size_id = (
        SELECT svs.id
        FROM shop_vehicle_sizes svs
        JOIN services s ON s.shop_id = svs.shop_id
        WHERE s.id = service_vehicle_size_supplements.service_id
        AND (
            (service_vehicle_size_supplements.size = 'S' AND LOWER(svs.name) = 'small') OR
            (service_vehicle_size_supplements.size = 'M' AND LOWER(svs.name) = 'medium') OR
            (service_vehicle_size_supplements.size = 'L' AND LOWER(svs.name) = 'large') OR
            (service_vehicle_size_supplements.size = 'XL' AND LOWER(svs.name) = 'x-large')
        )
        LIMIT 1
    )
    WHERE vehicle_size_id IS NULL
    AND size IS NOT NULL;

    RAISE NOTICE 'Migration des suppléments de tailles terminée';
END $$;

-- ========================================
-- ÉTAPE 3: VÉRIFICATION AVANT SUPPRESSION
-- ========================================

-- 3.1 Vérifier qu'il ne reste plus de données non migrées
SELECT
    'FINAL_CHECK' as status,
    'services_without_category_id' as item,
    COUNT(*) as count
FROM services
WHERE category_id IS NULL

UNION ALL

SELECT
    'FINAL_CHECK' as status,
    'supplements_without_vehicle_size_id' as item,
    COUNT(*) as count
FROM service_vehicle_size_supplements
WHERE vehicle_size_id IS NULL;

-- ========================================
-- ÉTAPE 4: SUPPRESSION (À DÉCOMMENTER APRÈS VÉRIFICATION)
-- ========================================

-- 4.1 Supprimer les colonnes obsolètes
-- ATTENTION: Décommenter seulement après avoir vérifié que tout est migré !

/*
-- Supprimer les anciennes colonnes
ALTER TABLE services DROP COLUMN IF EXISTS category;
ALTER TABLE service_vehicle_size_supplements DROP COLUMN IF EXISTS size;
ALTER TABLE shops DROP COLUMN IF EXISTS supported_vehicle_sizes;

-- Supprimer la table orpheline service_variants (si elle n'est pas utilisée)
DROP TABLE IF EXISTS service_variants;

COMMENT ON TABLE services IS 'Services avec category_id vers shop_service_categories';
COMMENT ON TABLE service_vehicle_size_supplements IS 'Suppléments avec vehicle_size_id vers shop_vehicle_sizes';
*/

-- ========================================
-- ÉTAPE 5: VÉRIFICATION FINALE
-- ========================================

SELECT
    'CLEANUP_COMPLETE' as status,
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('services', 'service_vehicle_size_supplements', 'shops')
    AND column_name IN ('category', 'size', 'supported_vehicle_sizes', 'category_id', 'vehicle_size_id', 'service_zones')
ORDER BY table_name, column_name;

