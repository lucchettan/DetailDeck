-- Script de seeding pour la base de données de développement
-- À exécuter après avoir créé le compte utilisateur test dans l'interface Auth
-- ⚠️ UNIQUEMENT SUR SecondDetailDeck (shxnokjzkfnreolujhew)

-- Ce script doit être exécuté avec l'ID du vrai utilisateur créé
-- Remplacez USER_ID_HERE par l'ID réel de l'utilisateur test

DO $$
DECLARE
    test_user_id uuid := '7bedf9b4-eb53-415c-a9a0-f58eac9c1133'::uuid; -- ID de dev@autocleanpro.com
    test_shop_id uuid;
    interior_category_id uuid;
    exterior_category_id uuid;
    citadine_size_id uuid;
    berline_size_id uuid;
    break_size_id uuid;
    minivan_size_id uuid;
    service1_id uuid;
    service2_id uuid;
    service3_id uuid;
    service4_id uuid;
BEGIN
    -- Vérifier que l'utilisateur existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = test_user_id) THEN
        RAISE EXCEPTION 'Utilisateur test non trouvé. Créez d''abord le compte dans l''interface Auth.';
    END IF;

    -- 1. Créer le shop de test
    INSERT INTO shops (
        owner_id,
        name,
        phone,
        email,
        shop_image_url,
        business_type,
        address_line1,
        address_city,
        address_postal_code,
        address_country,
        service_areas,
        schedule,
        min_booking_notice,
        max_booking_horizon,
        supported_vehicle_sizes
    ) VALUES (
        test_user_id,
        'AutoClean Pro - Développement',
        '+33 1 23 45 67 89',
        'dev@autocleanpro.com',
        'https://images.unsplash.com/photo-1616422285623-13ff0162193c?q=80&w=2070&auto=format&fit=crop',
        'mobile',
        '123 Avenue de la République',
        'Paris',
        '75011',
        'France',
        '[
            {"city": "Paris", "radius": 25},
            {"city": "Boulogne-Billancourt", "radius": 15},
            {"city": "Vincennes", "radius": 20}
        ]'::jsonb,
        '{
            "monday": {"isOpen": true, "timeframes": [{"from": "08:00", "to": "18:00"}]},
            "tuesday": {"isOpen": true, "timeframes": [{"from": "08:00", "to": "18:00"}]},
            "wednesday": {"isOpen": true, "timeframes": [{"from": "08:00", "to": "18:00"}]},
            "thursday": {"isOpen": true, "timeframes": [{"from": "08:00", "to": "18:00"}]},
            "friday": {"isOpen": true, "timeframes": [{"from": "08:00", "to": "18:00"}]},
            "saturday": {"isOpen": true, "timeframes": [{"from": "09:00", "to": "17:00"}]},
            "sunday": {"isOpen": false, "timeframes": []}
        }'::jsonb,
        '4h',
        '8w',
        ARRAY['S', 'M', 'L', 'XL']
    ) RETURNING id INTO test_shop_id;

    -- 2. Créer les catégories de services
    INSERT INTO shop_service_categories (shop_id, name) VALUES
        (test_shop_id, 'Intérieur') RETURNING id INTO interior_category_id;

    INSERT INTO shop_service_categories (shop_id, name) VALUES
        (test_shop_id, 'Extérieur') RETURNING id INTO exterior_category_id;

    -- 3. Créer les tailles de véhicules
    INSERT INTO shop_vehicle_sizes (shop_id, name) VALUES
        (test_shop_id, 'Citadine') RETURNING id INTO citadine_size_id;

    INSERT INTO shop_vehicle_sizes (shop_id, name) VALUES
        (test_shop_id, 'Berline') RETURNING id INTO berline_size_id;

    INSERT INTO shop_vehicle_sizes (shop_id, name) VALUES
        (test_shop_id, 'Break/SUV') RETURNING id INTO break_size_id;

    INSERT INTO shop_vehicle_sizes (shop_id, name) VALUES
        (test_shop_id, '4x4/Minivan') RETURNING id INTO minivan_size_id;

    -- 4. Créer des services réalistes
    -- Service Intérieur 1
    INSERT INTO services (shop_id, category_id, name, description, base_price, base_duration, is_active) VALUES
        (test_shop_id, interior_category_id, 'Nettoyage complet intérieur',
         'Aspirateur, nettoyage des sièges, tableau de bord, vitres intérieures et désodorisation',
         45, 60, true) RETURNING id INTO service1_id;

    -- Service Intérieur 2
    INSERT INTO services (shop_id, category_id, name, description, base_price, base_duration, is_active) VALUES
        (test_shop_id, interior_category_id, 'Détailing cuir premium',
         'Nettoyage, nourrissage et protection des sièges cuir avec produits haut de gamme',
         85, 90, true) RETURNING id INTO service2_id;

    -- Service Extérieur 1
    INSERT INTO services (shop_id, category_id, name, description, base_price, base_duration, is_active) VALUES
        (test_shop_id, exterior_category_id, 'Lavage extérieur premium',
         'Prélavage, lavage 2 seaux, décontamination, séchage et finition cire',
         35, 45, true) RETURNING id INTO service3_id;

    -- Service Extérieur 2
    INSERT INTO services (shop_id, category_id, name, description, base_price, base_duration, is_active) VALUES
        (test_shop_id, exterior_category_id, 'Polissage et céramique',
         'Correction des micro-rayures, polissage et application d''un traitement céramique 6 mois',
         180, 180, true) RETURNING id INTO service4_id;

    -- 5. Créer les suppléments par taille de véhicule
    -- Pour chaque service, créer les suppléments
    INSERT INTO service_vehicle_size_supplements (service_id, vehicle_size_id, additional_price, additional_duration) VALUES
        (service1_id, citadine_size_id, 0, 0),
        (service1_id, berline_size_id, 10, 15),
        (service1_id, break_size_id, 20, 30),
        (service1_id, minivan_size_id, 35, 45),

        (service2_id, citadine_size_id, 0, 0),
        (service2_id, berline_size_id, 15, 20),
        (service2_id, break_size_id, 30, 40),
        (service2_id, minivan_size_id, 50, 60),

        (service3_id, citadine_size_id, 0, 0),
        (service3_id, berline_size_id, 8, 10),
        (service3_id, break_size_id, 15, 20),
        (service3_id, minivan_size_id, 25, 30),

        (service4_id, citadine_size_id, 0, 0),
        (service4_id, berline_size_id, 30, 30),
        (service4_id, break_size_id, 60, 60),
        (service4_id, minivan_size_id, 100, 90);

    -- 6. Créer des réservations de test (mix passées/futures)
    INSERT INTO reservations (
        shop_id, client_name, client_email, client_phone,
        reservation_date, status, total_price
    ) VALUES
        (test_shop_id, 'Marie Test', 'marie.test@example.com', '+33 6 12 34 56 78',
         (CURRENT_TIMESTAMP - INTERVAL '5 days'), 'completed', 55),

        (test_shop_id, 'Jean Test', 'jean.test@example.com', '+33 6 98 76 54 32',
         (CURRENT_TIMESTAMP - INTERVAL '3 days'), 'completed', 35),

        (test_shop_id, 'Pierre Test', 'pierre.test@example.com', '+33 6 55 44 33 22',
         (CURRENT_TIMESTAMP + INTERVAL '2 days'), 'upcoming', 45),

        (test_shop_id, 'Amélie Test', 'amelie.test@example.com', '+33 6 77 88 99 00',
         (CURRENT_TIMESTAMP + INTERVAL '4 days'), 'upcoming', 100);

    -- 7. Créer des leads de test
    INSERT INTO leads (
        shop_id, client_name, client_email, client_phone, status
    ) VALUES
        (test_shop_id, 'Carla Test', 'carla.test@example.com', '+33 6 12 98 76 54', 'to_call'),
        (test_shop_id, 'Marc Test', 'marc.test@example.com', '+33 6 87 65 43 21', 'to_call'),
        (test_shop_id, 'Lucie Test', 'lucie.test@example.com', '+33 6 99 88 77 66', 'to_call');

    RAISE NOTICE '✅ Base de données de développement seedée !';
    RAISE NOTICE '📊 Shop: % créé', (SELECT name FROM shops WHERE id = test_shop_id);
    RAISE NOTICE '📋 % catégories créées', (SELECT COUNT(*) FROM shop_service_categories WHERE shop_id = test_shop_id);
    RAISE NOTICE '🚗 % tailles de véhicules créées', (SELECT COUNT(*) FROM shop_vehicle_sizes WHERE shop_id = test_shop_id);
    RAISE NOTICE '⚙️ % services créés', (SELECT COUNT(*) FROM services WHERE shop_id = test_shop_id);
    RAISE NOTICE '📅 % réservations créées', (SELECT COUNT(*) FROM reservations WHERE shop_id = test_shop_id);
    RAISE NOTICE '👥 % leads créés', (SELECT COUNT(*) FROM leads WHERE shop_id = test_shop_id);

END $$;
