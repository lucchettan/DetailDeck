-- Requête corrigée pour analyser les relations DB
-- (Fix de l'erreur UNION types bigint and text cannot be matched)

-- 1. Compter les tables et leurs colonnes
SELECT
    'TABLE' as type,
    table_name as name,
    CAST((SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') AS text) as info
FROM information_schema.tables t
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'

UNION ALL

-- 2. Lister les Foreign Keys
SELECT
    'FOREIGN_KEY' as type,
    tc.table_name || ' -> ' || ccu.table_name as name,
    ku.column_name || ' -> ' || ccu.column_name as info
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'

UNION ALL

-- 3. Lister les Index (cast en text pour éviter l'erreur UNION)
SELECT
    'INDEX' as type,
    schemaname || '.' || tablename as name,
    indexname as info
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'

ORDER BY type, name;

