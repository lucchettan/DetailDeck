-- =====================================================
-- REDESIGN COMPLET DE LA BASE DE DONNÉES
-- =====================================================
-- Ce script redéfinit complètement la structure pour supporter :
-- - Variations de prix par taille de véhicule (dans les services)
-- - Add-ons liés aux services
-- - Réservations avec plusieurs services
-- - Relations cohérentes entre toutes les entités

-- Supprimer toutes les tables existantes (dans l'ordre inverse des dépendances)
DROP TABLE IF EXISTS reservation_services CASCADE;
DROP TABLE IF EXISTS reservation_addons CASCADE;
DROP TABLE IF EXISTS service_addons CASCADE;
DROP TABLE IF EXISTS addons CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS shop_service_categories CASCADE;
DROP TABLE IF EXISTS shop_vehicle_sizes CASCADE;
DROP TABLE IF EXISTS shops CASCADE;

-- =====================================================
-- 1. SHOPS (Magasins)
-- =====================================================
CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    address_line1 TEXT,
    address_city TEXT,
    address_postal_code TEXT,
    address_country TEXT DEFAULT 'France',
    business_type TEXT DEFAULT 'local', -- 'local', 'mobile', 'both'
    service_zones JSONB DEFAULT '[]', -- Zones d'intervention pour mobile
    opening_hours JSONB DEFAULT '{}', -- Horaires d'ouverture
    booking_rules JSONB DEFAULT '{}', -- Règles de réservation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. SHOP_VEHICLE_SIZES (Tailles de véhicules)
-- =====================================================
CREATE TABLE shop_vehicle_sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- 'Citadine', 'Berline', 'SUV', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. SHOP_SERVICE_CATEGORIES (Catégories de services)
-- =====================================================
CREATE TABLE shop_service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- 'Intérieur', 'Extérieur', etc.
    icon_name TEXT DEFAULT 'detailing', -- Nom de l'icône pour la catégorie
    image_url TEXT, -- URL de l'image de la catégorie
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. SERVICES (Services avec variations de prix)
-- =====================================================
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES shop_service_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0, -- Prix de base
    base_duration INTEGER NOT NULL DEFAULT 30, -- Durée de base en minutes
    -- VARIATIONS DE PRIX PAR TAILLE DE VÉHICULE
    -- Format: {"vehicle_size_id": {"price": 10, "duration": 15}, ...}
    vehicle_size_variations JSONB DEFAULT '{}',
    -- ADD-ONS SPÉCIFIQUES AU SERVICE
    -- Format: [{"name": "Cire", "price": 25, "duration": 0, "description": "Protection cire"}]
    specific_addons JSONB DEFAULT '[]',
    image_urls TEXT[] DEFAULT '{}', -- URLs des images (max 4)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. ADDONS (Add-ons génériques)
-- =====================================================
CREATE TABLE addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- 'Cire', 'Protection', etc.
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    duration INTEGER NOT NULL DEFAULT 0, -- Durée additionnelle en minutes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. SERVICE_ADDONS (Relation services <-> add-ons)
-- =====================================================
CREATE TABLE service_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
    is_available BOOLEAN DEFAULT true, -- Cet add-on est-il disponible pour ce service ?
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(service_id, addon_id)
);

-- =====================================================
-- 7. RESERVATIONS (Réservations)
-- =====================================================
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_duration INTEGER NOT NULL DEFAULT 0, -- Durée totale en minutes
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
    notes TEXT,
    vehicle_size_id UUID REFERENCES shop_vehicle_sizes(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. RESERVATION_SERVICES (Services dans une réservation)
-- =====================================================
CREATE TABLE reservation_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1, -- Nombre de fois que ce service est réservé
    unit_price DECIMAL(10,2) NOT NULL, -- Prix unitaire (avec variations de taille)
    total_price DECIMAL(10,2) NOT NULL, -- Prix total (unit_price * quantity)
    duration INTEGER NOT NULL, -- Durée totale pour ce service
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. RESERVATION_ADDONS (Add-ons dans une réservation)
-- =====================================================
CREATE TABLE reservation_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id), -- Add-on lié à un service spécifique (optionnel)
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    duration INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES POUR LES PERFORMANCES
-- =====================================================
CREATE INDEX idx_services_shop_id ON services(shop_id);
CREATE INDEX idx_services_category_id ON services(category_id);
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_reservations_shop_id ON reservations(shop_id);
CREATE INDEX idx_reservations_date ON reservations(date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservation_services_reservation_id ON reservation_services(reservation_id);
CREATE INDEX idx_reservation_services_service_id ON reservation_services(service_id);
CREATE INDEX idx_reservation_addons_reservation_id ON reservation_addons(reservation_id);
CREATE INDEX idx_service_addons_service_id ON service_addons(service_id);
CREATE INDEX idx_service_addons_addon_id ON service_addons(addon_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_vehicle_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_addons ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les shops
CREATE POLICY "Users can view their own shop" ON shops FOR SELECT USING (auth.email() = email);
CREATE POLICY "Users can update their own shop" ON shops FOR UPDATE USING (auth.email() = email);
CREATE POLICY "Users can insert their own shop" ON shops FOR INSERT WITH CHECK (auth.email() = email);

-- Politiques RLS pour les tailles de véhicules
CREATE POLICY "Users can manage vehicle sizes for their shop" ON shop_vehicle_sizes
    FOR ALL USING (shop_id IN (SELECT id FROM shops WHERE email = auth.email()));

-- Politiques RLS pour les catégories de services
CREATE POLICY "Users can manage service categories for their shop" ON shop_service_categories
    FOR ALL USING (shop_id IN (SELECT id FROM shops WHERE email = auth.email()));

-- Politiques RLS pour les services
CREATE POLICY "Users can manage services for their shop" ON services
    FOR ALL USING (shop_id IN (SELECT id FROM shops WHERE email = auth.email()));

-- Politiques RLS pour les add-ons
CREATE POLICY "Users can manage addons for their shop" ON addons
    FOR ALL USING (shop_id IN (SELECT id FROM shops WHERE email = auth.email()));

-- Politiques RLS pour les relations service-addons
CREATE POLICY "Users can manage service-addon relations for their shop" ON service_addons
    FOR ALL USING (service_id IN (SELECT id FROM services WHERE shop_id IN (SELECT id FROM shops WHERE email = auth.email())));

-- Politiques RLS pour les réservations
CREATE POLICY "Users can manage reservations for their shop" ON reservations
    FOR ALL USING (shop_id IN (SELECT id FROM shops WHERE email = auth.email()));

-- Politiques RLS pour les services de réservation
CREATE POLICY "Users can manage reservation services for their shop" ON reservation_services
    FOR ALL USING (reservation_id IN (SELECT id FROM reservations WHERE shop_id IN (SELECT id FROM shops WHERE email = auth.email())));

-- Politiques RLS pour les add-ons de réservation
CREATE POLICY "Users can manage reservation addons for their shop" ON reservation_addons
    FOR ALL USING (reservation_id IN (SELECT id FROM reservations WHERE shop_id IN (SELECT id FROM shops WHERE email = auth.email())));

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour calculer le prix total d'une réservation
CREATE OR REPLACE FUNCTION calculate_reservation_total(reservation_uuid UUID)
RETURNS TABLE(total_price DECIMAL, total_duration INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(rs.total_price), 0) + COALESCE(SUM(ra.total_price), 0) as total_price,
        COALESCE(SUM(rs.duration), 0) + COALESCE(SUM(ra.duration), 0) as total_duration
    FROM reservations r
    LEFT JOIN reservation_services rs ON rs.reservation_id = r.id
    LEFT JOIN reservation_addons ra ON ra.reservation_id = r.id
    WHERE r.id = reservation_uuid;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les variations de prix d'un service
CREATE OR REPLACE FUNCTION get_service_price_variations(service_uuid UUID, vehicle_size_uuid UUID)
RETURNS TABLE(price DECIMAL, duration INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.base_price + COALESCE((s.vehicle_size_variations->vehicle_size_uuid::text->>'price')::DECIMAL, 0) as price,
        s.base_duration + COALESCE((s.vehicle_size_variations->vehicle_size_uuid::text->>'duration')::INTEGER, 0) as duration
    FROM services s
    WHERE s.id = service_uuid;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DONNÉES DE DÉMONSTRATION
-- =====================================================

-- Shop de démonstration
INSERT INTO shops (id, email, name, phone, address_line1, address_city, address_postal_code, business_type) VALUES
('ed6198b7-8fbb-4d22-9f36-06e49eaa70cd', 'lucchettan@example.com', 'Auto Clean Pro', '0123456789', '123 Rue de la Paix', 'Paris', '75001', 'both');

-- Tailles de véhicules
INSERT INTO shop_vehicle_sizes (id, shop_id, name) VALUES
('vs1', 'ed6198b7-8fbb-4d22-9f36-06e49eaa70cd', 'Citadine'),
('vs2', 'ed6198b7-8fbb-4d22-9f36-06e49eaa70cd', 'Berline'),
('vs3', 'ed6198b7-8fbb-4d22-9f36-06e49eaa70cd', 'SUV'),
('vs4', 'ed6198b7-8fbb-4d22-9f36-06e49eaa70cd', '4x4/Minivan');

-- Catégories de services
INSERT INTO shop_service_categories (id, shop_id, name, is_active) VALUES
('cat1', 'ed6198b7-8fbb-4d22-9f36-06e49eaa70cd', 'Intérieur', true),
('cat2', 'ed6198b7-8fbb-4d22-9f36-06e49eaa70cd', 'Extérieur', true),
('cat3', 'ed6198b7-8fbb-4d22-9f36-06e49eaa70cd', 'Céramique', true);

-- Services avec variations de prix
INSERT INTO services (id, shop_id, category_id, name, description, base_price, base_duration, vehicle_size_variations, is_active) VALUES
('f32b07f0-a328-4714-84cf-1106716f0ed2', 'ed6198b7-8fbb-4d22-9f36-06e49eaa70cd', 'cat1', 'Nettoyage intérieur complet', 'Aspiration, nettoyage des sièges, tableau de bord, vitres', 50, 60,
 '{"vs1": {"price": 0, "duration": 0}, "vs2": {"price": 10, "duration": 15}, "vs3": {"price": 20, "duration": 30}, "vs4": {"price": 30, "duration": 45}}', true),
('srv2', 'ed6198b7-8fbb-4d22-9f36-06e49eaa70cd', 'cat1', 'Nettoyage sièges cuir', 'Nettoyage et conditionnement des sièges en cuir', 40, 45,
 '{"vs1": {"price": 0, "duration": 0}, "vs2": {"price": 5, "duration": 10}, "vs3": {"price": 10, "duration": 15}, "vs4": {"price": 15, "duration": 20}}', true),
('srv3', 'ed6198b7-8fbb-4d22-9f36-06e49eaa70cd', 'cat2', 'Lavage extérieur complet', 'Lavage, séchage, nettoyage jantes et pneumatiques', 30, 45,
 '{"vs1": {"price": 0, "duration": 0}, "vs2": {"price": 5, "duration": 10}, "vs3": {"price": 10, "duration": 15}, "vs4": {"price": 15, "duration": 20}}', true),
('srv4', 'ed6198b7-8fbb-4d22-9f36-06e49eaa70cd', 'cat2', 'Cire traditionnelle', 'Application de cire pour protection et brillance', 60, 90,
 '{"vs1": {"price": 0, "duration": 0}, "vs2": {"price": 15, "duration": 20}, "vs3": {"price": 25, "duration": 30}, "vs4": {"price": 35, "duration": 45}}', true);

-- Add-ons
INSERT INTO addons (id, shop_id, name, description, price, duration, is_active) VALUES
('addon1', 'ed6198b7-8fbb-4d22-9f36-06e49eaa70cd', 'Protection céramique', 'Application d\'une protection céramique longue durée', 150, 120, true),
('addon2', 'ed6198b7-8fbb-4d22-9f36-06e49eaa70cd', 'Nettoyage moteur', 'Nettoyage et dégraissage du compartiment moteur', 40, 30, true),
('addon3', 'ed6198b7-8fbb-4d22-9f36-06e49eaa70cd', 'Traitement cuir', 'Traitement nourrissant pour sièges cuir', 25, 20, true);

-- Relations service-addons
INSERT INTO service_addons (service_id, addon_id, is_available) VALUES
('f32b07f0-a328-4714-84cf-1106716f0ed2', 'addon3', true), -- Nettoyage intérieur + traitement cuir
('srv2', 'addon3', true), -- Nettoyage sièges cuir + traitement cuir
('srv3', 'addon1', true), -- Lavage extérieur + protection céramique
('srv3', 'addon2', true), -- Lavage extérieur + nettoyage moteur
('srv4', 'addon1', true); -- Cire + protection céramique

-- =====================================================
-- VUES UTILITAIRES
-- =====================================================

-- Vue pour les services avec leurs variations de prix
CREATE VIEW services_with_variations AS
SELECT
    s.*,
    ssc.name as category_name,
    jsonb_object_agg(
        vs.id::text,
        jsonb_build_object(
            'name', vs.name,
            'price', COALESCE((s.vehicle_size_variations->vs.id::text->>'price')::DECIMAL, 0),
            'duration', COALESCE((s.vehicle_size_variations->vs.id::text->>'duration')::INTEGER, 0)
        )
    ) as vehicle_size_details
FROM services s
JOIN shop_service_categories ssc ON ssc.id = s.category_id
CROSS JOIN shop_vehicle_sizes vs
WHERE vs.shop_id = s.shop_id
GROUP BY s.id, ssc.name;

-- Vue pour les réservations complètes
CREATE VIEW reservations_complete AS
SELECT
    r.*,
    vs.name as vehicle_size_name,
    jsonb_agg(
        jsonb_build_object(
            'service_id', rs.service_id,
            'service_name', s.name,
            'quantity', rs.quantity,
            'unit_price', rs.unit_price,
            'total_price', rs.total_price,
            'duration', rs.duration
        )
    ) as services,
    jsonb_agg(
        jsonb_build_object(
            'addon_id', ra.addon_id,
            'addon_name', a.name,
            'quantity', ra.quantity,
            'unit_price', ra.unit_price,
            'total_price', ra.total_price,
            'duration', ra.duration
        )
    ) as addons
FROM reservations r
LEFT JOIN shop_vehicle_sizes vs ON vs.id = r.vehicle_size_id
LEFT JOIN reservation_services rs ON rs.reservation_id = r.id
LEFT JOIN services s ON s.id = rs.service_id
LEFT JOIN reservation_addons ra ON ra.reservation_id = r.id
LEFT JOIN addons a ON a.id = ra.addon_id
GROUP BY r.id, vs.name;

COMMIT;

