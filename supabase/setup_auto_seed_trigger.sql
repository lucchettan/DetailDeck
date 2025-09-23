-- ========================================
-- SETUP AUTO-SEED TRIGGER POUR NOUVEAUX SHOPS
-- ========================================
-- Ce script configure le déclencheur automatique pour seeder
-- les catégories et tailles de véhicules par défaut

-- ========================================
-- ÉTAPE 1: CRÉER LA FONCTION TRIGGER
-- ========================================

CREATE OR REPLACE FUNCTION trigger_auto_seed_new_shop()
RETURNS TRIGGER AS $$
DECLARE
  response_data jsonb;
BEGIN
  -- Appeler la fonction Edge Function pour auto-seed
  -- Note: En production, utiliser pg_net ou une autre méthode pour appeler l'Edge Function

  -- Pour l'instant, on fait l'auto-seed directement en SQL
  -- Détecter la langue (simple heuristique)
  DECLARE
    shop_language text := 'fr'; -- Par défaut français
  BEGIN
    -- Logique simple de détection de langue
    IF NEW.email LIKE '%.com' AND NEW.email NOT LIKE '%.fr' THEN
      shop_language := 'en';
    ELSIF NEW.email LIKE '%.es' THEN
      shop_language := 'es';
    END IF;

    -- Insérer les catégories par défaut selon la langue
    IF shop_language = 'en' THEN
      INSERT INTO shop_service_categories (shop_id, name, description, created_at, updated_at) VALUES
        (NEW.id, 'Interior', 'Cabin cleaning and protection', NOW(), NOW()),
        (NEW.id, 'Exterior', 'Washing, polishing and bodywork protection', NOW(), NOW());

      INSERT INTO shop_vehicle_sizes (shop_id, name, description, created_at, updated_at) VALUES
        (NEW.id, 'Compact', 'Small urban cars (Clio, 208, Polo, etc.)', NOW(), NOW()),
        (NEW.id, 'Sedan / Coupe', 'Sedans, coupes, convertibles (BMW 3 Series, Audi A4, etc.)', NOW(), NOW()),
        (NEW.id, 'Wagon / Compact SUV', 'Wagons, compact SUVs (X3, Q5, Tiguan, etc.)', NOW(), NOW()),
        (NEW.id, '4x4 / Minivan', 'Large 4x4s, minivans, commercial vehicles (X5, Espace, Transporter, etc.)', NOW(), NOW());

    ELSIF shop_language = 'es' THEN
      INSERT INTO shop_service_categories (shop_id, name, description, created_at, updated_at) VALUES
        (NEW.id, 'Interior', 'Limpieza y protección del habitáculo', NOW(), NOW()),
        (NEW.id, 'Exterior', 'Lavado, pulido y protección de la carrocería', NOW(), NOW());

      INSERT INTO shop_vehicle_sizes (shop_id, name, description, created_at, updated_at) VALUES
        (NEW.id, 'Urbano', 'Coches urbanos pequeños (Clio, 208, Polo, etc.)', NOW(), NOW()),
        (NEW.id, 'Berlina / Coupé', 'Berlinas, cupés, descapotables (BMW Serie 3, Audi A4, etc.)', NOW(), NOW()),
        (NEW.id, 'Familiar / SUV Compacto', 'Familiares, SUV compactos (X3, Q5, Tiguan, etc.)', NOW(), NOW()),
        (NEW.id, '4x4 / Monovolumen', 'Grandes 4x4, monovolúmenes, comerciales (X5, Espace, Transporter, etc.)', NOW(), NOW());

    ELSE -- Français par défaut
      INSERT INTO shop_service_categories (shop_id, name, description, created_at, updated_at) VALUES
        (NEW.id, 'Intérieur', 'Nettoyage et protection de l''habitacle', NOW(), NOW()),
        (NEW.id, 'Extérieur', 'Lavage, polish et protection de la carrosserie', NOW(), NOW());

      INSERT INTO shop_vehicle_sizes (shop_id, name, description, created_at, updated_at) VALUES
        (NEW.id, 'Citadine', 'Petites voitures urbaines (Clio, 208, Polo, etc.)', NOW(), NOW()),
        (NEW.id, 'Berline / Coupé', 'Berlines, coupés, cabriolets (BMW Série 3, Audi A4, etc.)', NOW(), NOW()),
        (NEW.id, 'Break / SUV Compact', 'Breaks, SUV compacts (X3, Q5, Tiguan, etc.)', NOW(), NOW()),
        (NEW.id, '4x4 / Minivan', 'Gros 4x4, minivans, utilitaires (X5, Espace, Transporter, etc.)', NOW(), NOW());
    END IF;

    -- Log pour debug
    INSERT INTO logs (message, created_at) VALUES
      ('Auto-seeded shop ' || NEW.name || ' with language: ' || shop_language, NOW())
    ON CONFLICT DO NOTHING; -- Ignore si la table logs n'existe pas

  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- ÉTAPE 2: CRÉER LE TRIGGER
-- ========================================

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS auto_seed_new_shop_trigger ON shops;

-- Créer le nouveau trigger
CREATE TRIGGER auto_seed_new_shop_trigger
  AFTER INSERT ON shops
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_seed_new_shop();

-- ========================================
-- ÉTAPE 3: CRÉER UNE TABLE DE LOGS SIMPLE (OPTIONNEL)
-- ========================================

-- Table pour logger les auto-seeds (optionnel, pour debug)
CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ÉTAPE 4: TESTER LE TRIGGER (OPTIONNEL)
-- ========================================

-- Test du trigger avec un shop fictif
/*
INSERT INTO shops (name, email, owner_id, created_at, updated_at) VALUES
  ('Test Shop EN', 'test@example.com', gen_random_uuid(), NOW(), NOW());

INSERT INTO shops (name, email, owner_id, created_at, updated_at) VALUES
  ('Test Shop ES', 'test@example.es', gen_random_uuid(), NOW(), NOW());

INSERT INTO shops (name, email, owner_id, created_at, updated_at) VALUES
  ('Test Shop FR', 'test@example.fr', gen_random_uuid(), NOW(), NOW());

-- Vérifier les résultats
SELECT
  s.name as shop_name,
  s.email,
  COUNT(DISTINCT ssc.id) as categories_count,
  COUNT(DISTINCT svs.id) as vehicle_sizes_count
FROM shops s
LEFT JOIN shop_service_categories ssc ON ssc.shop_id = s.id
LEFT JOIN shop_vehicle_sizes svs ON svs.shop_id = s.id
WHERE s.name LIKE 'Test Shop%'
GROUP BY s.id, s.name, s.email;

-- Nettoyer les tests
DELETE FROM shops WHERE name LIKE 'Test Shop%';
*/

-- ========================================
-- ÉTAPE 5: VÉRIFICATION FINALE
-- ========================================

SELECT
  'AUTO_SEED_TRIGGER_SETUP_COMPLETE' as status,
  'Trigger créé avec succès' as message,
  'Les nouveaux shops auront automatiquement des catégories et tailles par défaut' as details;
