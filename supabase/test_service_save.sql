-- Script pour tester la sauvegarde d'un service
-- D'abord, vérifier qu'on a des catégories
SELECT id, name FROM shop_service_categories LIMIT 3;

-- Tester l'insertion d'un service
INSERT INTO services (
  shop_id,
  name,
  description,
  category_id,
  base_price,
  base_duration,
  is_active,
  image_urls
) VALUES (
  (SELECT id FROM shops LIMIT 1), -- Utiliser le premier shop
  'Test Service',
  'Description du service de test',
  (SELECT id FROM shop_service_categories LIMIT 1), -- Utiliser la première catégorie
  50,
  60,
  true,
  '{}'
) RETURNING *;

-- Vérifier que le service a été créé
SELECT * FROM services WHERE name = 'Test Service';

-- Tester la mise à jour
UPDATE services
SET
  name = 'Test Service Updated',
  base_price = 75,
  base_duration = 90
WHERE name = 'Test Service'
RETURNING *;

-- Nettoyer le test
DELETE FROM services WHERE name = 'Test Service Updated';




