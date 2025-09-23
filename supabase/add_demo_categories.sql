-- ========================================
-- AJOUTER LES CATÉGORIES AU COMPTE DÉMO
-- ========================================
-- Script pour ajouter les catégories de services au compte démo existant

DO $$
DECLARE
    demo_shop_id uuid;
BEGIN
    -- Récupérer l'ID du shop démo
    SELECT id INTO demo_shop_id FROM shops WHERE email = 'demo@account.com';

    IF demo_shop_id IS NULL THEN
        RAISE EXCEPTION 'Shop démo non trouvé avec email demo@account.com';
    END IF;

    -- Supprimer les catégories existantes pour éviter les doublons
    DELETE FROM shop_service_categories WHERE shop_id = demo_shop_id;

    -- Ajouter les catégories de services (colonnes minimales)
    INSERT INTO shop_service_categories (shop_id, name, is_active) VALUES
        (demo_shop_id, 'Intérieur', true),
        (demo_shop_id, 'Extérieur', true);

    -- Ajouter les tailles de véhicules si elles n'existent pas
    DELETE FROM shop_vehicle_sizes WHERE shop_id = demo_shop_id;

    INSERT INTO shop_vehicle_sizes (shop_id, name, subtitle, is_active) VALUES
        (demo_shop_id, 'Citadine', 'Petites voitures urbaines (Clio, 208, Polo, etc.)', true),
        (demo_shop_id, 'Berline', 'Voitures familiales (Mégane, 308, Golf, etc.)', true),
        (demo_shop_id, 'Break/SUV', 'Breaks et SUV compacts (Scenic, 3008, Tiguan, etc.)', true),
        (demo_shop_id, '4x4/Minivan', 'Gros SUV et monospaces (X5, Espace, Sharan, etc.)', true);

    RAISE NOTICE 'Catégories et tailles de véhicules ajoutées avec succès pour le shop démo !';

END $$;

-- Vérification
SELECT
    'CATEGORIES' as type,
    s.name as shop_name,
    COUNT(ssc.*) as nb_categories
FROM shops s
LEFT JOIN shop_service_categories ssc ON ssc.shop_id = s.id
WHERE s.email = 'demo@account.com'
GROUP BY s.id, s.name;

SELECT
    'VEHICLE_SIZES' as type,
    s.name as shop_name,
    COUNT(svs.*) as nb_vehicle_sizes
FROM shops s
LEFT JOIN shop_vehicle_sizes svs ON svs.shop_id = s.id
WHERE s.email = 'demo@account.com'
GROUP BY s.id, s.name;
