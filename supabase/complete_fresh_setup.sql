-- ========================================
-- SETUP COMPLET FRESH - DÉTRUIT ET RECRÉE TOUT
-- ========================================
-- ATTENTION: Ce script supprime TOUTES les tables et données
-- À utiliser uniquement pour un setup complet from scratch

-- ========================================
-- ÉTAPE 1: SUPPRIMER TOUTES LES TABLES
-- ========================================

-- Désactiver les contraintes temporairement
SET session_replication_role = replica;

-- Supprimer les tables dans l'ordre des dépendances (enfants d'abord)
DROP TABLE IF EXISTS formulas CASCADE;
DROP TABLE IF EXISTS service_vehicle_size_supplements CASCADE;
DROP TABLE IF EXISTS add_ons CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS shop_service_categories CASCADE;
DROP TABLE IF EXISTS shop_vehicle_sizes CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS shops CASCADE;

-- Réactiver les contraintes
SET session_replication_role = DEFAULT;

-- ========================================
-- ÉTAPE 2: CRÉER LES TABLES AVEC LA BONNE STRUCTURE
-- ========================================

-- Table shops
CREATE TABLE shops (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    phone text,
    email text,
    shop_image_url text,
    business_type text DEFAULT 'local',
    address_line1 text,
    address_city text,
    address_postal_code text,
    address_country text,
    service_areas jsonb,
    schedule jsonb,
    min_booking_notice text DEFAULT '4h',
    max_booking_horizon text DEFAULT '12w',
    supported_vehicle_sizes text[] DEFAULT ARRAY['S', 'M', 'L', 'XL'],
    created_at timestamptz DEFAULT now() NOT NULL,
    service_zones jsonb
);

-- Table shop_vehicle_sizes (sans description pour simplifier)
CREATE TABLE shop_vehicle_sizes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Table shop_service_categories (sans description pour simplifier)
CREATE TABLE shop_service_categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Table services
CREATE TABLE services (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    category_id uuid REFERENCES shop_service_categories(id) ON DELETE SET NULL,
    name text NOT NULL,
    description text,
    base_price integer NOT NULL,
    base_duration integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Table formulas
CREATE TABLE formulas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    additional_price integer DEFAULT 0,
    additional_duration integer DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Table service_vehicle_size_supplements
CREATE TABLE service_vehicle_size_supplements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    vehicle_size_id uuid NOT NULL REFERENCES shop_vehicle_sizes(id) ON DELETE CASCADE,
    additional_price integer DEFAULT 0,
    additional_duration integer DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Table add_ons
CREATE TABLE add_ons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    price integer NOT NULL,
    duration integer NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Table reservations (structure basique)
CREATE TABLE reservations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    client_name text,
    client_email text,
    client_phone text,
    reservation_date timestamptz,
    status text DEFAULT 'upcoming',
    total_price integer,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Table leads (structure basique)
CREATE TABLE leads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    client_name text,
    client_email text,
    client_phone text,
    status text DEFAULT 'to_call',
    created_at timestamptz DEFAULT now() NOT NULL
);

-- ========================================
-- ÉTAPE 3: ACTIVER RLS SUR TOUTES LES TABLES
-- ========================================

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_vehicle_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_vehicle_size_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- ========================================
-- ÉTAPE 4: CRÉER LES POLICIES RLS
-- ========================================

-- Shops: Users can manage their own shop
CREATE POLICY "Users can manage their own shop" ON shops
    FOR ALL USING (owner_id = auth.uid());

-- Services: Users can manage services for their shops
CREATE POLICY "Users can manage their shop services" ON services
    FOR ALL USING (
        shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    );

-- Shop vehicle sizes: Users can manage sizes for their shops
CREATE POLICY "Users can manage their shop vehicle sizes" ON shop_vehicle_sizes
    FOR ALL USING (
        shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    );

-- Shop service categories: Users can manage categories for their shops
CREATE POLICY "Users can manage their shop service categories" ON shop_service_categories
    FOR ALL USING (
        shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    );

-- Formulas: Users can manage formulas for their services
CREATE POLICY "Users can manage their service formulas" ON formulas
    FOR ALL USING (
        service_id IN (
            SELECT s.id FROM services s
            JOIN shops sh ON sh.id = s.shop_id
            WHERE sh.owner_id = auth.uid()
        )
    );

-- Service vehicle size supplements
CREATE POLICY "Users can manage their service supplements" ON service_vehicle_size_supplements
    FOR ALL USING (
        service_id IN (
            SELECT s.id FROM services s
            JOIN shops sh ON sh.id = s.shop_id
            WHERE sh.owner_id = auth.uid()
        )
    );

-- Add-ons: Users can manage add-ons for their shops
CREATE POLICY "Users can manage their shop add-ons" ON add_ons
    FOR ALL USING (
        shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    );

-- Reservations: Users can manage reservations for their shops
CREATE POLICY "Users can manage their shop reservations" ON reservations
    FOR ALL USING (
        shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    );

-- Leads: Users can manage leads for their shops
CREATE POLICY "Users can manage their shop leads" ON leads
    FOR ALL USING (
        shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    );

-- ========================================
-- ÉTAPE 5: INSÉRER LES DONNÉES DÉMO
-- ========================================

-- Créer le shop démo
INSERT INTO shops (
    name,
    address_line1,
    address_city,
    address_postal_code,
    address_country,
    phone,
    email,
    owner_id,
    business_type,
    schedule,
    supported_vehicle_sizes,
    min_booking_notice,
    max_booking_horizon,
    shop_image_url
) VALUES (
    'DetailPro Démo',
    '123 Rue de la Carrosserie',
    'Paris',
    '75001',
    'France',
    '+33 1 23 45 67 89',
    'demo@account.com',
    (SELECT id FROM auth.users WHERE email = 'demo@account.com' LIMIT 1),
    'mobile',
    '{
        "monday": {"isOpen": true, "timeframes": [{"from": "09:00", "to": "18:00"}]},
        "tuesday": {"isOpen": true, "timeframes": [{"from": "09:00", "to": "18:00"}]},
        "wednesday": {"isOpen": true, "timeframes": [{"from": "09:00", "to": "18:00"}]},
        "thursday": {"isOpen": true, "timeframes": [{"from": "09:00", "to": "18:00"}]},
        "friday": {"isOpen": true, "timeframes": [{"from": "09:00", "to": "18:00"}]},
        "saturday": {"isOpen": true, "timeframes": [{"from": "09:00", "to": "13:00"}]},
        "sunday": {"isOpen": false, "timeframes": []}
    }'::jsonb,
    ARRAY['S', 'M', 'L', 'XL'],
    '4h',
    '12w',
    'https://images.unsplash.com/photo-1616422285623-13ff0162193c?q=80&w=2070&auto=format&fit=crop'
);

-- Récupérer l'ID du shop pour les insertions suivantes
DO $$
DECLARE
    demo_shop_id uuid;
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
    -- Récupérer l'ID du shop démo
    SELECT id INTO demo_shop_id FROM shops WHERE email = 'demo@account.com';

    -- Créer les tailles de véhicules
    INSERT INTO shop_vehicle_sizes (shop_id, name) VALUES
        (demo_shop_id, 'Citadine') RETURNING id INTO citadine_size_id;
    INSERT INTO shop_vehicle_sizes (shop_id, name) VALUES
        (demo_shop_id, 'Berline / Coupé') RETURNING id INTO berline_size_id;
    INSERT INTO shop_vehicle_sizes (shop_id, name) VALUES
        (demo_shop_id, 'Break / SUV Compact') RETURNING id INTO break_size_id;
    INSERT INTO shop_vehicle_sizes (shop_id, name) VALUES
        (demo_shop_id, '4x4 / Minivan') RETURNING id INTO minivan_size_id;

    -- Créer les catégories de services
    INSERT INTO shop_service_categories (shop_id, name) VALUES
        (demo_shop_id, 'Intérieur') RETURNING id INTO interior_category_id;
    INSERT INTO shop_service_categories (shop_id, name) VALUES
        (demo_shop_id, 'Extérieur') RETURNING id INTO exterior_category_id;

    -- Créer les services
    INSERT INTO services (shop_id, category_id, name, description, base_price, base_duration, is_active) VALUES
        (demo_shop_id, interior_category_id, 'Nettoyage Intérieur Complet', 'Aspirateur complet, nettoyage des plastiques, cuirs et tissus. Traitement anti-bactérien et parfum au choix.', 89, 120, true)
        RETURNING id INTO service1_id;

    INSERT INTO services (shop_id, category_id, name, description, base_price, base_duration, is_active) VALUES
        (demo_shop_id, interior_category_id, 'Détailing Intérieur Premium', 'Service complet + traitement cuir, rénovation plastiques, shampoing sièges et protection longue durée.', 159, 180, true)
        RETURNING id INTO service2_id;

    INSERT INTO services (shop_id, category_id, name, description, base_price, base_duration, is_active) VALUES
        (demo_shop_id, exterior_category_id, 'Lavage Extérieur Complet', 'Pré-lavage, lavage 2 seaux, séchage microfibre, brillant pneus et plastiques extérieurs.', 45, 90, true)
        RETURNING id INTO service3_id;

    INSERT INTO services (shop_id, category_id, name, description, base_price, base_duration, is_active) VALUES
        (demo_shop_id, exterior_category_id, 'Polish & Cire Protection', 'Décontamination, polish machine, cire haute protection. Résultat brillance et protection 6 mois.', 199, 240, true)
        RETURNING id INTO service4_id;

    -- Créer les suppléments par taille pour chaque service
    -- Service 1: Nettoyage Intérieur Complet
    INSERT INTO service_vehicle_size_supplements (service_id, vehicle_size_id, additional_price, additional_duration) VALUES
        (service1_id, citadine_size_id, 0, 0),
        (service1_id, berline_size_id, 15, 15),
        (service1_id, break_size_id, 25, 30),
        (service1_id, minivan_size_id, 40, 45);

    -- Service 2: Détailing Intérieur Premium
    INSERT INTO service_vehicle_size_supplements (service_id, vehicle_size_id, additional_price, additional_duration) VALUES
        (service2_id, citadine_size_id, 0, 0),
        (service2_id, berline_size_id, 25, 30),
        (service2_id, break_size_id, 40, 45),
        (service2_id, minivan_size_id, 60, 60);

    -- Service 3: Lavage Extérieur Complet
    INSERT INTO service_vehicle_size_supplements (service_id, vehicle_size_id, additional_price, additional_duration) VALUES
        (service3_id, citadine_size_id, 0, 0),
        (service3_id, berline_size_id, 10, 15),
        (service3_id, break_size_id, 20, 30),
        (service3_id, minivan_size_id, 35, 45);

    -- Service 4: Polish & Cire Protection
    INSERT INTO service_vehicle_size_supplements (service_id, vehicle_size_id, additional_price, additional_duration) VALUES
        (service4_id, citadine_size_id, 0, 0),
        (service4_id, berline_size_id, 30, 30),
        (service4_id, break_size_id, 50, 60),
        (service4_id, minivan_size_id, 80, 90);

    -- Créer quelques formules premium
    INSERT INTO formulas (service_id, name, description, additional_price, additional_duration) VALUES
        (service2_id, 'Formule Luxe', 'Traitement cuir premium
Parfum longue durée
Protection UV
Garantie 6 mois', 50, 60);

    INSERT INTO formulas (service_id, name, description, additional_price, additional_duration) VALUES
        (service4_id, 'Protection Céramique', 'Coating céramique 2 ans
Hydrophobic extrême
Brillance incomparable
Entretien inclus', 150, 120);

    -- Créer quelques add-ons globaux
    INSERT INTO add_ons (shop_id, name, description, price, duration) VALUES
        (demo_shop_id, 'Nettoyage Moteur', 'Dégraissage et nettoyage complet du compartiment moteur', 35, 30),
        (demo_shop_id, 'Traitement Anti-Pluie', 'Application produit hydrophobe sur pare-brise et vitres latérales', 25, 15),
        (demo_shop_id, 'Ozone / Désodorisation', 'Traitement ozone pour éliminer 100% des odeurs (tabac, animaux, etc.)', 45, 45);

END $$;

-- ========================================
-- ÉTAPE 6: VÉRIFICATION FINALE
-- ========================================

SELECT
    'FRESH_SETUP_COMPLETE' as status,
    s.name as shop_name,
    COUNT(DISTINCT ssc.id) as categories_count,
    COUNT(DISTINCT svs.id) as vehicle_sizes_count,
    COUNT(DISTINCT srv.id) as services_count,
    COUNT(DISTINCT f.id) as formulas_count,
    COUNT(DISTINCT ao.id) as add_ons_count
FROM shops s
LEFT JOIN shop_service_categories ssc ON ssc.shop_id = s.id
LEFT JOIN shop_vehicle_sizes svs ON svs.shop_id = s.id
LEFT JOIN services srv ON srv.shop_id = s.id
LEFT JOIN formulas f ON f.service_id = srv.id
LEFT JOIN add_ons ao ON ao.shop_id = s.id
WHERE s.email = 'demo@account.com'
GROUP BY s.id, s.name;

-- Message de confirmation
SELECT
    'SETUP_COMPLETE' as type,
    'Base de données recréée et compte démo configuré avec succès!' as message,
    'Email: demo@account.com | Password: demoaccount' as credentials,
    'Shop: DetailPro Démo avec services complets et RLS activé' as details;
