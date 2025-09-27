-- ========================================
-- SEEDER DES DONNÉES DÉMO SUPPLÉMENTAIRES
-- ========================================
-- Ajoute des réservations et leads réalistes au compte démo

DO $$
DECLARE
    demo_shop_id uuid;
    interior_service_id uuid;
    exterior_service_id uuid;
    premium_service_id uuid;
    polish_service_id uuid;
BEGIN
    -- Récupérer l'ID du shop démo
    SELECT id INTO demo_shop_id FROM shops WHERE email = 'demo@account.com';

    -- Récupérer les IDs des services
    SELECT id INTO interior_service_id FROM services WHERE shop_id = demo_shop_id AND name = 'Nettoyage Intérieur Complet';
    SELECT id INTO premium_service_id FROM services WHERE shop_id = demo_shop_id AND name = 'Détailing Intérieur Premium';
    SELECT id INTO exterior_service_id FROM services WHERE shop_id = demo_shop_id AND name = 'Lavage Extérieur Complet';
    SELECT id INTO polish_service_id FROM services WHERE shop_id = demo_shop_id AND name = 'Polish & Cire Protection';

    -- ========================================
    -- CRÉER DES RÉSERVATIONS PASSÉES
    -- ========================================

    INSERT INTO reservations (shop_id, client_name, client_email, client_phone, reservation_date, status, total_price) VALUES
        (demo_shop_id, 'Marie Dupont', 'marie.dupont@email.com', '06 12 34 56 78', (NOW() - INTERVAL '15 days')::timestamptz, 'completed', 104),
        (demo_shop_id, 'Jean Martin', 'jean.martin@gmail.com', '06 23 45 67 89', (NOW() - INTERVAL '12 days')::timestamptz, 'completed', 75),
        (demo_shop_id, 'Sophie Bernard', 'sophie.b@outlook.fr', '06 34 56 78 90', (NOW() - INTERVAL '8 days')::timestamptz, 'completed', 244),
        (demo_shop_id, 'Pierre Moreau', 'p.moreau@yahoo.fr', '06 45 67 89 01', (NOW() - INTERVAL '5 days')::timestamptz, 'completed', 159),
        (demo_shop_id, 'Camille Rousseau', 'camille.rousseau@free.fr', '06 56 78 90 12', (NOW() - INTERVAL '3 days')::timestamptz, 'completed', 89);

    -- ========================================
    -- CRÉER DES RÉSERVATIONS À VENIR
    -- ========================================

    INSERT INTO reservations (shop_id, client_name, client_email, client_phone, reservation_date, status, total_price) VALUES
        (demo_shop_id, 'Thomas Leclerc', 'thomas.leclerc@gmail.com', '06 67 89 01 23', (NOW() + INTERVAL '2 days')::timestamptz, 'upcoming', 134),
        (demo_shop_id, 'Emma Petit', 'emma.petit@hotmail.fr', '06 78 90 12 34', (NOW() + INTERVAL '5 days')::timestamptz, 'upcoming', 199),
        (demo_shop_id, 'Lucas Garnier', 'lucas.garnier@orange.fr', '06 89 01 23 45', (NOW() + INTERVAL '8 days')::timestamptz, 'upcoming', 89),
        (demo_shop_id, 'Léa Fontaine', 'lea.fontaine@sfr.fr', '06 90 12 34 56', (NOW() + INTERVAL '12 days')::timestamptz, 'upcoming', 349);

    -- ========================================
    -- CRÉER DES LEADS (PROSPECTS)
    -- ========================================

    INSERT INTO leads (shop_id, client_name, client_phone, status, created_at) VALUES
        (demo_shop_id, 'Antoine Dubois', '06 01 23 45 67', 'to_call', NOW() - INTERVAL '2 hours'),
        (demo_shop_id, 'Julie Lemoine', '06 12 34 56 78', 'to_call', NOW() - INTERVAL '5 hours'),
        (demo_shop_id, 'Maxime Roux', '06 23 45 67 89', 'contacted', NOW() - INTERVAL '1 day'),
        (demo_shop_id, 'Clara Blanc', '06 34 56 78 90', 'to_call', NOW() - INTERVAL '3 hours'),
        (demo_shop_id, 'Hugo Leroy', '06 45 67 89 01', 'converted', NOW() - INTERVAL '2 days');

    RAISE NOTICE 'Données démo ajoutées avec succès!';
    RAISE NOTICE 'Réservations: 9 créées (5 passées, 4 à venir)';
    RAISE NOTICE 'Leads: 5 créés avec différents statuts';

END $$;

-- ========================================
-- VÉRIFICATION DES DONNÉES CRÉÉES
-- ========================================

SELECT
    'DEMO_DATA_SUMMARY' as type,
    s.name as shop_name,
    COUNT(DISTINCT r.id) as total_reservations,
    COUNT(DISTINCT CASE WHEN r.status = 'completed' THEN r.id END) as completed_reservations,
    COUNT(DISTINCT CASE WHEN r.status = 'upcoming' THEN r.id END) as upcoming_reservations,
    COUNT(DISTINCT l.id) as total_leads,
    COUNT(DISTINCT CASE WHEN l.status = 'to_call' THEN l.id END) as leads_to_call,
    COUNT(DISTINCT srv.id) as total_services,
    COUNT(DISTINCT ssc.id) as total_categories,
    COUNT(DISTINCT svs.id) as total_vehicle_sizes
FROM shops s
LEFT JOIN reservations r ON r.shop_id = s.id
LEFT JOIN leads l ON l.shop_id = s.id
LEFT JOIN services srv ON srv.shop_id = s.id
LEFT JOIN shop_service_categories ssc ON ssc.shop_id = s.id
LEFT JOIN shop_vehicle_sizes svs ON svs.shop_id = s.id
WHERE s.email = 'demo@account.com'
GROUP BY s.id, s.name;
