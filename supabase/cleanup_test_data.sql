-- Script pour nettoyer les données de test
-- ATTENTION: Ce script supprime toutes les données de test

-- Supprimer les réservations de test
DELETE FROM reservations WHERE client_name LIKE '%test%' OR client_name LIKE '%Test%' OR client_name LIKE '%TEST%';

-- Supprimer les leads de test
DELETE FROM leads WHERE client_name LIKE '%test%' OR client_name LIKE '%Test%' OR client_name LIKE '%TEST%';

-- Supprimer les services de test (ceux qui ne sont pas dans les catégories principales)
DELETE FROM services WHERE name LIKE '%test%' OR name LIKE '%Test%' OR name LIKE '%TEST%';

-- Supprimer les formules orphelines
DELETE FROM formulas WHERE service_id NOT IN (SELECT id FROM services);

-- Supprimer les supplements orphelins
DELETE FROM service_vehicle_size_supplements WHERE service_id NOT IN (SELECT id FROM services);

-- Supprimer les add-ons orphelins
DELETE FROM add_ons WHERE service_id NOT IN (SELECT id FROM services);

-- Nettoyer les catégories de test
DELETE FROM shop_service_categories WHERE name LIKE '%test%' OR name LIKE '%Test%' OR name LIKE '%TEST%';

-- Nettoyer les tailles de véhicule de test
DELETE FROM shop_vehicle_sizes WHERE name LIKE '%test%' OR name LIKE '%Test%' OR name LIKE '%TEST%';

-- Afficher un résumé
SELECT
  'Services' as table_name,
  COUNT(*) as count
FROM services
UNION ALL
SELECT
  'Categories' as table_name,
  COUNT(*) as count
FROM shop_service_categories
UNION ALL
SELECT
  'Vehicle Sizes' as table_name,
  COUNT(*) as count
FROM shop_vehicle_sizes
UNION ALL
SELECT
  'Reservations' as table_name,
  COUNT(*) as count
FROM reservations
UNION ALL
SELECT
  'Leads' as table_name,
  COUNT(*) as count
FROM leads;



