/**
 * Script de seeding pour créer des données de shop complètes
 * Utilise un shop existant et ajoute toutes les données nécessaires
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Charger les variables d'environnement depuis .env
const envContent = readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

// Configuration Supabase
const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedShopData() {
  console.log('🌱 Début du seeding des données de shop...\n');

  try {
    // 1. Récupérer le premier shop existant
    console.log('1️⃣ Récupération du shop existant...');
    const { data: shops, error: shopsError } = await supabase
      .from('shops')
      .select('*')
      .limit(1);

    if (shopsError) throw shopsError;

    if (!shops || shops.length === 0) {
      console.log('❌ Aucun shop trouvé. Veuillez d\'abord créer un shop via l\'interface.');
      return;
    }

    const shop = shops[0];
    console.log('✅ Shop trouvé:', shop.name);

    // 2. Créer les tailles de véhicules
    console.log('\n2️⃣ Création des tailles de véhicules...');
    const vehicleSizes = [
      {
        shop_id: shop.id,
        name: 'Citadine/Compacte',
        blurb: 'Voitures de ville, berlines compactes',
        image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=400&h=300&fit=crop',
        order: 1
      },
      {
        shop_id: shop.id,
        name: 'Berline/SUV moyen',
        blurb: 'Berlines familiales, SUV moyens',
        image: 'https://images.unsplash.com/photo-1549317336-206569e8475c?w=400&h=300&fit=crop',
        order: 2
      },
      {
        shop_id: shop.id,
        name: 'SUV/4x4 grand format',
        blurb: 'Grands SUV, 4x4, véhicules utilitaires',
        image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&h=300&fit=crop',
        order: 3
      }
    ];

    const { data: createdVehicleSizes, error: vehicleSizesError } = await supabase
      .from('shop_vehicle_sizes')
      .upsert(vehicleSizes, { onConflict: 'shop_id,name' })
      .select();

    if (vehicleSizesError) throw vehicleSizesError;
    console.log('✅ Tailles de véhicules créées:', createdVehicleSizes.length);

    // 3. Créer les catégories de services
    console.log('\n3️⃣ Création des catégories de services...');
    const categories = [
      {
        shop_id: shop.id,
        name: 'Nettoyage Intérieur',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
        order: 1,
        is_active: true
      },
      {
        shop_id: shop.id,
        name: 'Nettoyage Extérieur',
        image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop',
        order: 2,
        is_active: true
      },
      {
        shop_id: shop.id,
        name: 'Prestations Premium',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        order: 3,
        is_active: true
      }
    ];

    const { data: createdCategories, error: categoriesError } = await supabase
      .from('shop_service_categories')
      .upsert(categories, { onConflict: 'shop_id,name' })
      .select();

    if (categoriesError) throw categoriesError;
    console.log('✅ Catégories créées:', createdCategories.length);

    // 4. Créer les services
    console.log('\n4️⃣ Création des services...');
    const services = [
      // Nettoyage Intérieur
      {
        shop_id: shop.id,
        category_id: createdCategories[0].id,
        name: 'Nettoyage Intérieur Complet',
        description: 'Aspiration complète, nettoyage des sièges, tableau de bord, portières et coffre. Produits professionnels et techniques avancées.',
        base_price: 4500, // 45€
        base_duration: 90,
        image_urls: [
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop'
        ],
        vehicle_size_variations: {
          [createdVehicleSizes[0].id]: { price: 0, duration: 0 },
          [createdVehicleSizes[1].id]: { price: 1000, duration: 15 },
          [createdVehicleSizes[2].id]: { price: 2000, duration: 30 }
        },
        formulas: [
          {
            name: 'Formule Confort',
            additionalPrice: 1500,
            additionalDuration: 20,
            features: [
              'Shampoing tapis en profondeur',
              'Nettoyage plastiques satinés',
              'Traitement cuir (si applicable)',
              'Désodorisation habitacle'
            ]
          },
          {
            name: 'Formule Premium',
            additionalPrice: 3000,
            additionalDuration: 40,
            features: [
              'Tout de la formule Confort',
              'Nettoyage climatisation',
              'Protection tissus',
              'Nettoyage jantes intérieures'
            ]
          }
        ],
        order: 1,
        is_active: true
      },
      {
        shop_id: shop.id,
        category_id: createdCategories[0].id,
        name: 'Nettoyage Sièges',
        description: 'Nettoyage spécialisé des sièges en tissu ou cuir. Élimination des taches et protection.',
        base_price: 2500, // 25€
        base_duration: 45,
        image_urls: [
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'
        ],
        vehicle_size_variations: {
          [createdVehicleSizes[0].id]: { price: 0, duration: 0 },
          [createdVehicleSizes[1].id]: { price: 500, duration: 10 },
          [createdVehicleSizes[2].id]: { price: 1000, duration: 20 }
        },
        formulas: [
          {
            name: 'Formule Cuir',
            additionalPrice: 1000,
            additionalDuration: 15,
            features: [
              'Nettoyage cuir spécialisé',
              'Conditioning cuir',
              'Protection UV'
            ]
          }
        ],
        order: 2,
        is_active: true
      },
      // Nettoyage Extérieur
      {
        shop_id: shop.id,
        category_id: createdCategories[1].id,
        name: 'Lavage Extérieur Complet',
        description: 'Lavage haute pression, décontamination, nettoyage jantes et pneumatiques. Finition au chiffon microfibre.',
        base_price: 3500, // 35€
        base_duration: 60,
        image_urls: [
          'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop'
        ],
        vehicle_size_variations: {
          [createdVehicleSizes[0].id]: { price: 0, duration: 0 },
          [createdVehicleSizes[1].id]: { price: 1000, duration: 15 },
          [createdVehicleSizes[2].id]: { price: 2000, duration: 30 }
        },
        formulas: [
          {
            name: 'Formule Brillance',
            additionalPrice: 2000,
            additionalDuration: 25,
            features: [
              'Cire liquide',
              'Nettoyage jantes décontamination',
              'Traitement pneumatiques',
              'Séchage sans traces'
            ]
          }
        ],
        order: 1,
        is_active: true
      },
      {
        shop_id: shop.id,
        category_id: createdCategories[1].id,
        name: 'Décontamination Ferreuse',
        description: 'Élimination des particules de fer et de la rouille. Protection de la peinture.',
        base_price: 4000, // 40€
        base_duration: 75,
        image_urls: [
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop'
        ],
        vehicle_size_variations: {
          [createdVehicleSizes[0].id]: { price: 0, duration: 0 },
          [createdVehicleSizes[1].id]: { price: 1500, duration: 20 },
          [createdVehicleSizes[2].id]: { price: 3000, duration: 40 }
        },
        formulas: [],
        order: 2,
        is_active: true
      },
      // Prestations Premium
      {
        shop_id: shop.id,
        category_id: createdCategories[2].id,
        name: 'Traitement Céramique',
        description: 'Application d\'un revêtement céramique pour une protection longue durée et un éclat exceptionnel.',
        base_price: 15000, // 150€
        base_duration: 180,
        image_urls: [
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop'
        ],
        vehicle_size_variations: {
          [createdVehicleSizes[0].id]: { price: 0, duration: 0 },
          [createdVehicleSizes[1].id]: { price: 5000, duration: 30 },
          [createdVehicleSizes[2].id]: { price: 10000, duration: 60 }
        },
        formulas: [
          {
            name: 'Céramique 6 mois',
            additionalPrice: 0,
            additionalDuration: 0,
            features: [
              'Protection 6 mois',
              'Facilité d\'entretien',
              'Éclat renforcé'
            ]
          },
          {
            name: 'Céramique 12 mois',
            additionalPrice: 5000,
            additionalDuration: 60,
            features: [
              'Protection 12 mois',
              'Facilité d\'entretien maximale',
              'Éclat exceptionnel',
              'Garantie étendue'
            ]
          }
        ],
        order: 1,
        is_active: true
      }
    ];

    const { data: createdServices, error: servicesError } = await supabase
      .from('services')
      .upsert(services, { onConflict: 'shop_id,name' })
      .select();

    if (servicesError) throw servicesError;
    console.log('✅ Services créés:', createdServices.length);

    // 5. Créer les add-ons
    console.log('\n5️⃣ Création des add-ons...');
    const addOns = [
      {
        shop_id: shop.id,
        service_id: createdServices[0].id, // Nettoyage Intérieur Complet
        name: 'Désodorisation Ozone',
        description: 'Élimination complète des odeurs avec traitement ozone',
        price: 2000, // 20€
        duration: 30,
        order: 1,
        is_active: true
      },
      {
        shop_id: shop.id,
        service_id: createdServices[0].id,
        name: 'Nettoyage Climatisation',
        description: 'Désinfection et nettoyage du système de climatisation',
        price: 1500, // 15€
        duration: 20,
        order: 2,
        is_active: true
      },
      {
        shop_id: shop.id,
        service_id: createdServices[2].id, // Lavage Extérieur Complet
        name: 'Cire Carnauba',
        description: 'Application de cire carnauba premium pour un éclat naturel',
        price: 2500, // 25€
        duration: 25,
        order: 1,
        is_active: true
      },
      {
        shop_id: shop.id,
        service_id: createdServices[2].id,
        name: 'Nettoyage Moteur',
        description: 'Nettoyage sécurisé du compartiment moteur',
        price: 3000, // 30€
        duration: 35,
        order: 2,
        is_active: true
      },
      {
        shop_id: shop.id,
        service_id: createdServices[4].id, // Traitement Céramique
        name: 'Correction Peinture',
        description: 'Polissage et correction des micro-rayures avant céramique',
        price: 8000, // 80€
        duration: 120,
        order: 1,
        is_active: true
      }
    ];

    const { data: createdAddOns, error: addOnsError } = await supabase
      .from('addons')
      .upsert(addOns, { onConflict: 'shop_id,service_id,name' })
      .select();

    if (addOnsError) throw addOnsError;
    console.log('✅ Add-ons créés:', createdAddOns.length);

    console.log('\n🎉 Seeding terminé avec succès !');
    console.log('\n📋 Résumé des données créées:');
    console.log(`   🏪 Shop: ${shop.name} (${shop.slug})`);
    console.log(`   🚗 Tailles de véhicules: ${createdVehicleSizes.length}`);
    console.log(`   📂 Catégories: ${createdCategories.length}`);
    console.log(`   🧽 Services: ${createdServices.length}`);
    console.log(`   ➕ Add-ons: ${createdAddOns.length}`);
    console.log(`\n🔗 URL de test: http://localhost:5174/${shop.slug}`);

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Exécuter le seeding
seedShopData();
