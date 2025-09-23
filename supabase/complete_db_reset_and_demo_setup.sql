-- ========================================
-- RESET COMPLET DE LA BASE DE DONNÉES
-- ========================================
-- ATTENTION: Ce script supprime TOUTES les données
-- À utiliser uniquement pour un reset complet avant mise en production

-- ========================================
-- ÉTAPE 1: SUPPRESSION DES DONNÉES
-- ========================================

-- Désactiver les contraintes temporairement pour éviter les erreurs de dépendances
SET session_replication_role = replica;

-- Supprimer toutes les données (dans l'ordre des dépendances)
TRUNCATE TABLE formulas CASCADE;
TRUNCATE TABLE service_vehicle_size_supplements CASCADE;
TRUNCATE TABLE add_ons CASCADE;
TRUNCATE TABLE services CASCADE;
TRUNCATE TABLE shop_service_categories CASCADE;
TRUNCATE TABLE shop_vehicle_sizes CASCADE;
TRUNCATE TABLE reservations CASCADE;
TRUNCATE TABLE leads CASCADE;
TRUNCATE TABLE shops CASCADE;

-- Supprimer les utilisateurs (garder seulement les comptes système)
DELETE FROM auth.users WHERE email != 'demo@account.com';

-- Réactiver les contraintes
SET session_replication_role = DEFAULT;

-- ========================================
-- ÉTAPE 2: SETUP DU COMPTE DÉMO
-- ========================================

-- Créer l'utilisateur démo (à faire via Supabase Auth Admin si pas encore fait)
-- Email: demo@account.com
-- Password: demoaccount
-- Note: Ceci doit être fait manuellement via l'interface Supabase Auth

-- Supposons que l'UUID du compte démo sera généré automatiquement
-- On va utiliser une variable pour simplifier (à remplacer par l'UUID réel)

-- ========================================
-- ÉTAPE 3: CRÉER LE SHOP DÉMO
-- ========================================

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

-- Récupérer l'ID du shop créé pour la suite
-- (En production, on utilisera l'UUID généré)

-- ========================================
-- ÉTAPE 4: CRÉER LES TAILLES DE VÉHICULES STANDARD
-- ========================================

-- Français (par défaut)
INSERT INTO shop_vehicle_sizes (shop_id, name, description)
SELECT
    s.id,
    'Citadine',
    'Petites voitures urbaines (Clio, 208, Polo, etc.)'
FROM shops s WHERE s.email = 'demo@account.com';

INSERT INTO shop_vehicle_sizes (shop_id, name, description)
SELECT
    s.id,
    'Berline / Coupé',
    'Berlines, coupés, cabriolets (BMW Série 3, Audi A4, etc.)'
FROM shops s WHERE s.email = 'demo@account.com';

INSERT INTO shop_vehicle_sizes (shop_id, name, description)
SELECT
    s.id,
    'Break / SUV Compact',
    'Breaks, SUV compacts (X3, Q5, Tiguan, etc.)'
FROM shops s WHERE s.email = 'demo@account.com';

INSERT INTO shop_vehicle_sizes (shop_id, name, description)
SELECT
    s.id,
    '4x4 / Minivan',
    'Gros 4x4, minivans, utilitaires (X5, Espace, Transporter, etc.)'
FROM shops s WHERE s.email = 'demo@account.com';

-- ========================================
-- ÉTAPE 5: CRÉER LES CATÉGORIES DE SERVICES
-- ========================================

INSERT INTO shop_service_categories (shop_id, name, description)
SELECT
    s.id,
    'Intérieur',
    'Nettoyage et protection de l''habitacle'
FROM shops s WHERE s.email = 'demo@account.com';

INSERT INTO shop_service_categories (shop_id, name, description)
SELECT
    s.id,
    'Extérieur',
    'Lavage, polish et protection de la carrosserie'
FROM shops s WHERE s.email = 'demo@account.com';

-- ========================================
-- ÉTAPE 6: CRÉER LES SERVICES DÉMO
-- ========================================

-- Services Intérieur
INSERT INTO services (
    shop_id,
    category_id,
    name,
    description,
    base_price,
    base_duration,
    is_active
)
SELECT
    s.id,
    ssc.id,
    'Nettoyage Intérieur Complet',
    'Aspirateur complet, nettoyage des plastiques, cuirs et tissus. Traitement anti-bactérien et parfum au choix.',
    89,
    120,
    true
FROM shops s
JOIN shop_service_categories ssc ON ssc.shop_id = s.id
WHERE s.email = 'demo@account.com' AND ssc.name = 'Intérieur';

INSERT INTO services (
    shop_id,
    category_id,
    name,
    description,
    base_price,
    base_duration,
    is_active
)
SELECT
    s.id,
    ssc.id,
    'Détailing Intérieur Premium',
    'Service complet + traitement cuir, rénovation plastiques, shampoing sièges et protection longue durée.',
    159,
    180,
    true
FROM shops s
JOIN shop_service_categories ssc ON ssc.shop_id = s.id
WHERE s.email = 'demo@account.com' AND ssc.name = 'Intérieur';

-- Services Extérieur
INSERT INTO services (
    shop_id,
    category_id,
    name,
    description,
    base_price,
    base_duration,
    is_active
)
SELECT
    s.id,
    ssc.id,
    'Lavage Extérieur Complet',
    'Pré-lavage, lavage 2 seaux, séchage microfibre, brillant pneus et plastiques extérieurs.',
    45,
    90,
    true
FROM shops s
JOIN shop_service_categories ssc ON ssc.shop_id = s.id
WHERE s.email = 'demo@account.com' AND ssc.name = 'Extérieur';

INSERT INTO services (
    shop_id,
    category_id,
    name,
    description,
    base_price,
    base_duration,
    is_active
)
SELECT
    s.id,
    ssc.id,
    'Polish & Cire Protection',
    'Décontamination, polish machine, cire haute protection. Résultat brillance et protection 6 mois.',
    199,
    240,
    true
FROM shops s
JOIN shop_service_categories ssc ON ssc.shop_id = s.id
WHERE s.email = 'demo@account.com' AND ssc.name = 'Extérieur';

-- ========================================
-- ÉTAPE 7: CRÉER LES SUPPLÉMENTS PAR TAILLE
-- ========================================

-- Suppléments pour le service Nettoyage Intérieur Complet
INSERT INTO service_vehicle_size_supplements (service_id, vehicle_size_id, additional_price, additional_duration)
SELECT
    srv.id,
    svs.id,
    CASE
        WHEN svs.name = 'Citadine' THEN 0
        WHEN svs.name = 'Berline / Coupé' THEN 15
        WHEN svs.name = 'Break / SUV Compact' THEN 25
        WHEN svs.name = '4x4 / Minivan' THEN 40
    END,
    CASE
        WHEN svs.name = 'Citadine' THEN 0
        WHEN svs.name = 'Berline / Coupé' THEN 15
        WHEN svs.name = 'Break / SUV Compact' THEN 30
        WHEN svs.name = '4x4 / Minivan' THEN 45
    END
FROM services srv
JOIN shops s ON s.id = srv.shop_id
JOIN shop_vehicle_sizes svs ON svs.shop_id = s.id
WHERE s.email = 'demo@account.com'
AND srv.name = 'Nettoyage Intérieur Complet';

-- Suppléments pour le service Détailing Intérieur Premium
INSERT INTO service_vehicle_size_supplements (service_id, vehicle_size_id, additional_price, additional_duration)
SELECT
    srv.id,
    svs.id,
    CASE
        WHEN svs.name = 'Citadine' THEN 0
        WHEN svs.name = 'Berline / Coupé' THEN 25
        WHEN svs.name = 'Break / SUV Compact' THEN 40
        WHEN svs.name = '4x4 / Minivan' THEN 60
    END,
    CASE
        WHEN svs.name = 'Citadine' THEN 0
        WHEN svs.name = 'Berline / Coupé' THEN 30
        WHEN svs.name = 'Break / SUV Compact' THEN 45
        WHEN svs.name = '4x4 / Minivan' THEN 60
    END
FROM services srv
JOIN shops s ON s.id = srv.shop_id
JOIN shop_vehicle_sizes svs ON svs.shop_id = s.id
WHERE s.email = 'demo@account.com'
AND srv.name = 'Détailing Intérieur Premium';

-- Suppléments pour le service Lavage Extérieur Complet
INSERT INTO service_vehicle_size_supplements (service_id, vehicle_size_id, additional_price, additional_duration)
SELECT
    srv.id,
    svs.id,
    CASE
        WHEN svs.name = 'Citadine' THEN 0
        WHEN svs.name = 'Berline / Coupé' THEN 10
        WHEN svs.name = 'Break / SUV Compact' THEN 20
        WHEN svs.name = '4x4 / Minivan' THEN 35
    END,
    CASE
        WHEN svs.name = 'Citadine' THEN 0
        WHEN svs.name = 'Berline / Coupé' THEN 15
        WHEN svs.name = 'Break / SUV Compact' THEN 30
        WHEN svs.name = '4x4 / Minivan' THEN 45
    END
FROM services srv
JOIN shops s ON s.id = srv.shop_id
JOIN shop_vehicle_sizes svs ON svs.shop_id = s.id
WHERE s.email = 'demo@account.com'
AND srv.name = 'Lavage Extérieur Complet';

-- Suppléments pour le service Polish & Cire Protection
INSERT INTO service_vehicle_size_supplements (service_id, vehicle_size_id, additional_price, additional_duration)
SELECT
    srv.id,
    svs.id,
    CASE
        WHEN svs.name = 'Citadine' THEN 0
        WHEN svs.name = 'Berline / Coupé' THEN 30
        WHEN svs.name = 'Break / SUV Compact' THEN 50
        WHEN svs.name = '4x4 / Minivan' THEN 80
    END,
    CASE
        WHEN svs.name = 'Citadine' THEN 0
        WHEN svs.name = 'Berline / Coupé' THEN 30
        WHEN svs.name = 'Break / SUV Compact' THEN 60
        WHEN svs.name = '4x4 / Minivan' THEN 90
    END
FROM services srv
JOIN shops s ON s.id = srv.shop_id
JOIN shop_vehicle_sizes svs ON svs.shop_id = s.id
WHERE s.email = 'demo@account.com'
AND srv.name = 'Polish & Cire Protection';

-- ========================================
-- ÉTAPE 8: CRÉER QUELQUES FORMULES PREMIUM
-- ========================================

-- Formule Premium pour le Détailing Intérieur
INSERT INTO formulas (service_id, name, description, additional_price, additional_duration)
SELECT
    srv.id,
    'Formule Luxe',
    'Traitement cuir premium
Parfum longue durée
Protection UV
Garantie 6 mois',
    50,
    60
FROM services srv
JOIN shops s ON s.id = srv.shop_id
WHERE s.email = 'demo@account.com'
AND srv.name = 'Détailing Intérieur Premium';

-- Formule Premium pour le Polish
INSERT INTO formulas (service_id, name, description, additional_price, additional_duration)
SELECT
    srv.id,
    'Protection Céramique',
    'Coating céramique 2 ans
Hydrophobic extrême
Brillance incomparable
Entretien inclus',
    150,
    120
FROM services srv
JOIN shops s ON s.id = srv.shop_id
WHERE s.email = 'demo@account.com'
AND srv.name = 'Polish & Cire Protection';

-- ========================================
-- ÉTAPE 9: CRÉER QUELQUES ADD-ONS GLOBAUX
-- ========================================

INSERT INTO add_ons (shop_id, name, description, price, duration)
SELECT
    s.id,
    'Nettoyage Moteur',
    'Dégraissage et nettoyage complet du compartiment moteur',
    35,
    30
FROM shops s WHERE s.email = 'demo@account.com';

INSERT INTO add_ons (shop_id, name, description, price, duration)
SELECT
    s.id,
    'Traitement Anti-Pluie',
    'Application produit hydrophobe sur pare-brise et vitres latérales',
    25,
    15
FROM shops s WHERE s.email = 'demo@account.com';

INSERT INTO add_ons (shop_id, name, description, price, duration)
SELECT
    s.id,
    'Ozone / Désodorisation',
    'Traitement ozone pour éliminer 100% des odeurs (tabac, animaux, etc.)',
    45,
    45
FROM shops s WHERE s.email = 'demo@account.com';

-- ========================================
-- ÉTAPE 10: VÉRIFICATION FINALE
-- ========================================

SELECT
    'DEMO_SETUP_COMPLETE' as status,
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
    'SETUP_INSTRUCTIONS' as type,
    'Compte démo créé avec succès!' as message,
    'Email: demo@account.com | Password: demoaccount' as credentials,
    'Shop: DetailPro Démo avec services complets' as details;
