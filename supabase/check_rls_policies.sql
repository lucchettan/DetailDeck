-- Vérification complète des RLS Policies
-- À exécuter dans Supabase SQL Editor

-- ========================================
-- ÉTAPE 1: VÉRIFIER L'ÉTAT DU RLS
-- ========================================

-- 1.1 Tables avec RLS activé
SELECT
    'RLS_STATUS' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

-- ========================================
-- ÉTAPE 2: LISTER TOUTES LES POLICIES
-- ========================================

-- 2.1 Policies existantes par table
SELECT
    'EXISTING_POLICY' as type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- ÉTAPE 3: TABLES CRITIQUES SANS RLS
-- ========================================

-- 3.1 Identifier les tables critiques qui devraient avoir RLS
WITH critical_tables AS (
    SELECT unnest(ARRAY[
        'shops', 'services', 'formulas', 'add_ons',
        'service_vehicle_size_supplements', 'shop_vehicle_sizes',
        'shop_service_categories', 'reservations', 'leads'
    ]) as table_name
)
SELECT
    'MISSING_RLS' as status,
    ct.table_name,
    COALESCE(pt.rowsecurity, false) as has_rls,
    CASE
        WHEN pt.rowsecurity THEN 'RLS activé ✅'
        ELSE 'RLS manquant ⚠️'
    END as security_status
FROM critical_tables ct
LEFT JOIN pg_tables pt ON pt.tablename = ct.table_name AND pt.schemaname = 'public'
ORDER BY has_rls, ct.table_name;

-- ========================================
-- ÉTAPE 4: COMPTER LES POLICIES PAR TABLE
-- ========================================

-- 4.1 Nombre de policies par table critique
WITH critical_tables AS (
    SELECT unnest(ARRAY[
        'shops', 'services', 'formulas', 'add_ons',
        'service_vehicle_size_supplements', 'shop_vehicle_sizes',
        'shop_service_categories', 'reservations', 'leads'
    ]) as table_name
)
SELECT
    'POLICY_COUNT' as type,
    ct.table_name,
    COUNT(pp.policyname) as policy_count,
    CASE
        WHEN COUNT(pp.policyname) = 0 THEN 'Aucune policy ⚠️'
        WHEN COUNT(pp.policyname) = 1 THEN 'Une policy (peut-être insuffisant)'
        ELSE 'Policies multiples ✅'
    END as policy_status
FROM critical_tables ct
LEFT JOIN pg_policies pp ON pp.tablename = ct.table_name AND pp.schemaname = 'public'
GROUP BY ct.table_name
ORDER BY policy_count, ct.table_name;

