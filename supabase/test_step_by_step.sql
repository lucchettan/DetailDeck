-- Test 1: Verifier service_variants
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

