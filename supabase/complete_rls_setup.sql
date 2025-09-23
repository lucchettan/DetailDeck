-- Setup complet des RLS Policies pour la sécurité
-- À exécuter après avoir vérifié l'état actuel

-- ========================================
-- ÉTAPE 1: ACTIVER RLS SUR TOUTES LES TABLES CRITIQUES
-- ========================================

-- Tables principales
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_vehicle_size_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Nouvelles tables customisables
ALTER TABLE shop_vehicle_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_service_categories ENABLE ROW LEVEL SECURITY;

-- ========================================
-- ÉTAPE 2: POLICIES POUR SHOPS (BASE)
-- ========================================

-- Shop owners can manage their own shop
DROP POLICY IF EXISTS "Users can manage their own shop" ON shops;
CREATE POLICY "Users can manage their own shop" ON shops
    FOR ALL USING (owner_id = auth.uid());

-- ========================================
-- ÉTAPE 3: POLICIES POUR SERVICES & RELATED
-- ========================================

-- Services: Users can manage services for their shops
DROP POLICY IF EXISTS "Users can manage their shop services" ON services;
CREATE POLICY "Users can manage their shop services" ON services
    FOR ALL USING (
        shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    );

-- Formulas: Users can manage formulas for their services
DROP POLICY IF EXISTS "Users can manage their service formulas" ON formulas;
CREATE POLICY "Users can manage their service formulas" ON formulas
    FOR ALL USING (
        service_id IN (
            SELECT s.id FROM services s
            JOIN shops sh ON sh.id = s.shop_id
            WHERE sh.owner_id = auth.uid()
        )
    );

-- Add-ons: Users can manage add-ons for their shops
DROP POLICY IF EXISTS "Users can manage their shop add-ons" ON add_ons;
CREATE POLICY "Users can manage their shop add-ons" ON add_ons
    FOR ALL USING (
        shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    );

-- Service supplements: Users can manage supplements for their services
DROP POLICY IF EXISTS "Users can manage their service supplements" ON service_vehicle_size_supplements;
CREATE POLICY "Users can manage their service supplements" ON service_vehicle_size_supplements
    FOR ALL USING (
        service_id IN (
            SELECT s.id FROM services s
            JOIN shops sh ON sh.id = s.shop_id
            WHERE sh.owner_id = auth.uid()
        )
    );

-- ========================================
-- ÉTAPE 4: POLICIES POUR LES NOUVELLES TABLES
-- ========================================

-- Vehicle sizes: Users can manage their shop's vehicle sizes
DROP POLICY IF EXISTS "Users can manage their shop vehicle sizes" ON shop_vehicle_sizes;
CREATE POLICY "Users can manage their shop vehicle sizes" ON shop_vehicle_sizes
    FOR ALL USING (
        shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    );

-- Service categories: Users can manage their shop's service categories
DROP POLICY IF EXISTS "Users can manage their shop service categories" ON shop_service_categories;
CREATE POLICY "Users can manage their shop service categories" ON shop_service_categories
    FOR ALL USING (
        shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    );

-- ========================================
-- ÉTAPE 5: POLICIES POUR RESERVATIONS & LEADS
-- ========================================

-- Reservations: Users can manage reservations for their shops
DROP POLICY IF EXISTS "Users can manage their shop reservations" ON reservations;
CREATE POLICY "Users can manage their shop reservations" ON reservations
    FOR ALL USING (
        shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    );

-- Leads: Users can manage leads for their shops
DROP POLICY IF EXISTS "Users can manage their shop leads" ON leads;
CREATE POLICY "Users can manage their shop leads" ON leads
    FOR ALL USING (
        shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    );

-- ========================================
-- ÉTAPE 6: POLICIES PUBLIQUES (BOOKING)
-- ========================================

-- Public can view active services for booking (READ ONLY)
DROP POLICY IF EXISTS "Public can view active services for booking" ON services;
CREATE POLICY "Public can view active services for booking" ON services
    FOR SELECT USING (status = 'active');

-- Public can view active formulas for booking (READ ONLY)
DROP POLICY IF EXISTS "Public can view active formulas for booking" ON formulas;
CREATE POLICY "Public can view active formulas for booking" ON formulas
    FOR SELECT USING (
        service_id IN (
            SELECT id FROM services WHERE status = 'active'
        )
    );

-- Public can view active add-ons for booking (READ ONLY)
DROP POLICY IF EXISTS "Public can view active add-ons for booking" ON add_ons;
CREATE POLICY "Public can view active add-ons for booking" ON add_ons
    FOR SELECT USING (true); -- Add-ons are generally public for booking

-- Public can view active vehicle sizes for booking (READ ONLY)
DROP POLICY IF EXISTS "Public can view active vehicle sizes for booking" ON shop_vehicle_sizes;
CREATE POLICY "Public can view active vehicle sizes for booking" ON shop_vehicle_sizes
    FOR SELECT USING (is_active = true);

-- Public can view active service categories for booking (READ ONLY)
DROP POLICY IF EXISTS "Public can view active service categories for booking" ON shop_service_categories;
CREATE POLICY "Public can view active service categories for booking" ON shop_service_categories
    FOR SELECT USING (is_active = true);

-- Public can view service supplements for booking (READ ONLY)
DROP POLICY IF EXISTS "Public can view service supplements for booking" ON service_vehicle_size_supplements;
CREATE POLICY "Public can view service supplements for booking" ON service_vehicle_size_supplements
    FOR SELECT USING (
        service_id IN (
            SELECT id FROM services WHERE status = 'active'
        )
    );

-- Public can view shop info for booking (READ ONLY)
DROP POLICY IF EXISTS "Public can view shop info for booking" ON shops;
CREATE POLICY "Public can view shop info for booking" ON shops
    FOR SELECT USING (true); -- Shops info is public for booking

-- Public can INSERT reservations (for booking)
DROP POLICY IF EXISTS "Public can create reservations" ON reservations;
CREATE POLICY "Public can create reservations" ON reservations
    FOR INSERT WITH CHECK (true); -- Anyone can book

-- Public can INSERT leads (for lead generation)
DROP POLICY IF EXISTS "Public can create leads" ON leads;
CREATE POLICY "Public can create leads" ON leads
    FOR INSERT WITH CHECK (true); -- Anyone can submit leads

-- ========================================
-- ÉTAPE 7: VÉRIFICATION FINALE
-- ========================================

-- Compter les policies par table
SELECT
    'POLICY_VERIFICATION' as type,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN (
        'shops', 'services', 'formulas', 'add_ons',
        'service_vehicle_size_supplements', 'shop_vehicle_sizes',
        'shop_service_categories', 'reservations', 'leads'
    )
GROUP BY tablename
ORDER BY tablename;

