-- Vérification des relations et index
SELECT 
    'TABLE COUNT' as type,
    table_name as name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as count_info
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'

UNION ALL

SELECT 
    'FOREIGN KEYS' as type,
    tc.table_name || ' -> ' || ccu.table_name as name,
    tc.constraint_name as count_info
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'

UNION ALL

SELECT 
    'INDEXES' as type,
    indexname as name,
    tablename as count_info
FROM pg_indexes 
WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'

ORDER BY type, name;
