-- Test 2: Verifier les anciennes colonnes encore utilisees
SELECT
    'legacy_columns_check' as type,
    'services.category' as column_name,
    COUNT(CASE WHEN category IS NOT NULL AND category != '' THEN 1 END) as used_count,
    COUNT(CASE WHEN category_id IS NULL THEN 1 END) as missing_new_column,
    CASE
        WHEN COUNT(CASE WHEN category IS NOT NULL AND category != '' THEN 1 END) = 0 THEN 'Ancienne colonne non utilisee'
        ELSE 'Ancienne colonne encore utilisee'
    END as status
FROM services;

