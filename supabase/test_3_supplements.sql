-- Test 3: Verifier les supplements vehicle size
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

