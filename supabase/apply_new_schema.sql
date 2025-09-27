-- =====================================================
-- SCRIPT POUR APPLIQUER LE NOUVEAU SCHÉMA
-- =====================================================
-- Ce script applique le nouveau schéma de base de données
-- ATTENTION: Ceci va supprimer toutes les données existantes !

-- Exécuter le script de redesign complet
\i complete_database_redesign.sql

-- Vérifier que tout a été créé correctement
SELECT 'Tables créées:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

SELECT 'Indexes créés:' as status;
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY indexname;

SELECT 'Politiques RLS créées:' as status;
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

SELECT 'Vues créées:' as status;
SELECT viewname FROM pg_views 
WHERE schemaname = 'public' 
ORDER BY viewname;

SELECT 'Fonctions créées:' as status;
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Test des données de démonstration
SELECT 'Données de démonstration:' as status;
SELECT 'Shops:' as table_name, count(*) as count FROM shops
UNION ALL
SELECT 'Vehicle Sizes:', count(*) FROM shop_vehicle_sizes
UNION ALL
SELECT 'Service Categories:', count(*) FROM shop_service_categories
UNION ALL
SELECT 'Services:', count(*) FROM services
UNION ALL
SELECT 'Addons:', count(*) FROM addons
UNION ALL
SELECT 'Service-Addon Relations:', count(*) FROM service_addons;

-- Test de la vue services_with_variations
SELECT 'Test vue services_with_variations:' as status;
SELECT name, category_name, vehicle_size_details 
FROM services_with_variations 
LIMIT 2;

COMMIT;




