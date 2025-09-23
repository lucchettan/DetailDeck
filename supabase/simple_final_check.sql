-- Verification finale simple avant mise en live

-- 1. Verifier service_variants (potentiellement a supprimer)
SELECT
    'service_variants_check' as type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN s.id IS NULL THEN 1 END) as orphaned_count,
    CASE
        WHEN COUNT(*) = 0 THEN 'Table vide peut etre supprimee'
        WHEN COUNT(CASE WHEN s.id IS NULL THEN 1 END) > 0 THEN 'Donnees orphelines detectees'
        ELSE 'Donnees valides mais table potentiellement dupliquee'
    END as status
FROM service_variants sv
LEFT JOIN services s ON s.id = sv.service_id;

-- 2. Verifier les anciennes colonnes encore utilisees
SELECT
    'legacy_columns_check' as type,
    'services.category' as column_name,
    COUNT(CASE WHEN category IS NOT NULL AND category != '' THEN 1 END) as used_count,
    COUNT(CASE WHEN category_id IS NULL THEN 1 END) as missing_new_column,
    CASE
        WHEN COUNT(CASE WHEN category IS NOT NULL AND category != '' THEN 1 END) = 0 THEN 'Ancienne colonne non utilisee'
        ELSE 'Ancienne colonne encore utilisee'
    END as status
FROM services

UNION ALL

SELECT
    'legacy_columns_check' as type,
    'service_vehicle_size_supplements.size' as column_name,
    COUNT(CASE WHEN size IS NOT NULL AND size != '' THEN 1 END) as used_count,
    COUNT(CASE WHEN vehicle_size_id IS NULL THEN 1 END) as missing_new_column,
    CASE
        WHEN COUNT(CASE WHEN size IS NOT NULL AND size != '' THEN 1 END) = 0 THEN 'Ancienne colonne non utilisee'
        ELSE 'Ancienne colonne encore utilisee'
    END as status
FROM service_vehicle_size_supplements;

-- 3. Verifier integrite des relations
SELECT
    'data_integrity_check' as type,
    'services_without_category' as issue,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) = 0 THEN 'Tous les services ont une categorie'
        ELSE 'Services sans categorie detectes'
    END as status
FROM services
WHERE category_id IS NULL

UNION ALL

SELECT
    'data_integrity_check' as type,
    'supplements_without_vehicle_size' as issue,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) = 0 THEN 'Tous les supplements ont une taille'
        ELSE 'Supplements sans taille detectes'
    END as status
FROM service_vehicle_size_supplements
WHERE vehicle_size_id IS NULL;

-- 4. Statistiques generales par shop
SELECT
    'shop_statistics' as type,
    s.name as shop_name,
    COUNT(DISTINCT srv.id) as services_count,
    COUNT(DISTINCT ssc.id) as categories_count,
    COUNT(DISTINCT svs.id) as vehicle_sizes_count,
    COUNT(DISTINCT f.id) as formulas_count,
    COUNT(DISTINCT r.id) as reservations_count
FROM shops s
LEFT JOIN services srv ON srv.shop_id = s.id
LEFT JOIN shop_service_categories ssc ON ssc.shop_id = s.id
LEFT JOIN shop_vehicle_sizes svs ON svs.shop_id = s.id
LEFT JOIN formulas f ON f.service_id = srv.id
LEFT JOIN reservations r ON r.shop_id = s.id
GROUP BY s.id, s.name
ORDER BY s.name;

-- 5. Verification des index de performance
SELECT
    'performance_check' as type,
    tablename,
    indexname,
    'Index present' as status
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN (
        'services', 'shop_service_categories', 'shop_vehicle_sizes',
        'service_vehicle_size_supplements', 'formulas', 'reservations'
    )
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 6. Resume final
SELECT
    'FINAL_STATUS' as type,
    'DATABASE_READY_CHECK' as status,
    'Verification terminee' as message,
    NOW() as checked_at;
