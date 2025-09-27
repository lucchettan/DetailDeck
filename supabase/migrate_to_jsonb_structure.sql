-- ========================================
-- MIGRATION VERS STRUCTURE JSONB COHÉRENTE
-- ========================================
-- Ce script migre de l'ancienne structure vers la nouvelle structure JSONB
-- ATTENTION: Sauvegardez vos données avant d'exécuter ce script

-- ========================================
-- ÉTAPE 1: SAUVEGARDER LES DONNÉES EXISTANTES
-- ========================================

-- Créer des tables temporaires pour sauvegarder les données
CREATE TEMP TABLE temp_formulas AS SELECT * FROM formulas;
CREATE TEMP TABLE temp_supplements AS SELECT * FROM service_vehicle_size_supplements;
CREATE TEMP TABLE temp_addons AS SELECT * FROM add_ons;

-- ========================================
-- ÉTAPE 2: AJOUTER LES COLONNES JSONB À SERVICES
-- ========================================

-- Ajouter les colonnes JSONB si elles n'existent pas
ALTER TABLE services
ADD COLUMN IF NOT EXISTS vehicle_size_variations jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS formulas jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';

-- ========================================
-- ÉTAPE 3: MIGRER LES DONNÉES VERS JSONB
-- ========================================

-- Migrer les formules vers le JSONB
UPDATE services
SET formulas = (
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', f.id,
            'name', f.name,
            'additionalPrice', f.additional_price,
            'additionalDuration', f.additional_duration,
            'includedItems', COALESCE(f.description, '')::text[]
        )
    )
    FROM temp_formulas f
    WHERE f.service_id = services.id
)
WHERE EXISTS (SELECT 1 FROM temp_formulas WHERE service_id = services.id);

-- Migrer les variations de taille vers le JSONB
UPDATE services
SET vehicle_size_variations = (
    SELECT jsonb_object_agg(
        vs.id::text,
        jsonb_build_object(
            'price', s.additional_price,
            'duration', s.additional_duration
        )
    )
    FROM temp_supplements s
    JOIN shop_vehicle_sizes vs ON vs.id = s.vehicle_size_id
    WHERE s.service_id = services.id
)
WHERE EXISTS (SELECT 1 FROM temp_supplements WHERE service_id = services.id);

-- ========================================
-- ÉTAPE 4: CRÉER LA NOUVELLE TABLE ADDONS
-- ========================================

-- Créer la nouvelle table addons (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS addons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id uuid REFERENCES services(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    price integer NOT NULL DEFAULT 0,
    duration integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Migrer les add-ons vers la nouvelle structure
INSERT INTO addons (service_id, name, description, price, duration)
SELECT
    NULL as service_id, -- Les add-ons génériques n'ont pas de service_id spécifique
    name,
    description,
    price,
    duration
FROM temp_addons
ON CONFLICT DO NOTHING;

-- ========================================
-- ÉTAPE 5: SUPPRIMER LES ANCIENNES TABLES
-- ========================================

-- Supprimer les tables redondantes
DROP TABLE IF EXISTS formulas CASCADE;
DROP TABLE IF EXISTS service_vehicle_size_supplements CASCADE;
DROP TABLE IF EXISTS add_ons CASCADE;

-- ========================================
-- ÉTAPE 6: CRÉER LES INDEX POUR LES PERFORMANCES
-- ========================================

-- Index pour les recherches JSONB
CREATE INDEX IF NOT EXISTS idx_services_vehicle_size_variations
ON services USING GIN (vehicle_size_variations);

CREATE INDEX IF NOT EXISTS idx_services_formulas
ON services USING GIN (formulas);

-- ========================================
-- ÉTAPE 7: VÉRIFICATION
-- ========================================

-- Vérifier que la migration s'est bien passée
SELECT
    'Services avec formules' as check_type,
    COUNT(*) as count
FROM services
WHERE jsonb_array_length(formulas) > 0

UNION ALL

SELECT
    'Services avec variations de taille' as check_type,
    COUNT(*) as count
FROM services
WHERE jsonb_typeof(vehicle_size_variations) = 'object'
AND jsonb_array_length(jsonb_object_keys(vehicle_size_variations)) > 0

UNION ALL

SELECT
    'Add-ons migrés' as check_type,
    COUNT(*) as count
FROM addons;

-- ========================================
-- ÉTAPE 8: NETTOYAGE
-- ========================================

-- Les tables temporaires seront automatiquement supprimées à la fin de la session
-- Aucune action nécessaire

-- ========================================
-- MIGRATION TERMINÉE
-- ========================================
-- La base de données utilise maintenant la structure JSONB cohérente
-- Les anciennes tables redondantes ont été supprimées
-- Les données ont été migrées vers la nouvelle structure

