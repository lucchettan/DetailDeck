-- ========================================
-- SCRIPT SIMPLE POUR AJOUTER LES DONNÉES DÉMO
-- ========================================
-- Ajoute uniquement les colonnes essentielles

DO $$
DECLARE
    demo_shop_id uuid;
BEGIN
    -- Récupérer l'ID du shop démo
    SELECT id INTO demo_shop_id FROM shops WHERE email = 'demo@account.com';

    IF demo_shop_id IS NULL THEN
        RAISE EXCEPTION 'Shop démo non trouvé avec email demo@account.com';
    END IF;

    -- Nettoyer les données existantes
    DELETE FROM shop_service_categories WHERE shop_id = demo_shop_id;
    DELETE FROM shop_vehicle_sizes WHERE shop_id = demo_shop_id;

    -- Ajouter les catégories (colonnes minimales uniquement)
    INSERT INTO shop_service_categories (shop_id, name) VALUES
        (demo_shop_id, 'Intérieur'),
        (demo_shop_id, 'Extérieur');

    -- Ajouter les tailles de véhicules (colonnes minimales uniquement)
    INSERT INTO shop_vehicle_sizes (shop_id, name) VALUES
        (demo_shop_id, 'Citadine'),
        (demo_shop_id, 'Berline'),
        (demo_shop_id, 'Break/SUV'),
        (demo_shop_id, '4x4/Minivan');

    RAISE NOTICE 'Données ajoutées avec succès !';
    RAISE NOTICE '- % catégories créées', (SELECT COUNT(*) FROM shop_service_categories WHERE shop_id = demo_shop_id);
    RAISE NOTICE '- % tailles de véhicules créées', (SELECT COUNT(*) FROM shop_vehicle_sizes WHERE shop_id = demo_shop_id);

END $$;
