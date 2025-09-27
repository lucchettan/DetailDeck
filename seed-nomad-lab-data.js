/**
 * Script de seeding pour créer des données de test complètes
 * Utilise hello@nomad-lab.io comme utilisateur de test
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

async function seedNomadLabData() {
  console.log('🌱 Début du seeding des données Nomad Lab...\n');

  try {
    // 1. Vérifier si l'utilisateur existe déjà
    console.log('1️⃣ Vérification de l\'utilisateur hello@nomad-lab.io...');

    // Essayer de se connecter avec l'utilisateur
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'hello@nomad-lab.io',
      password: 'nomadlab123'
    });

    let userId;
    if (signInError) {
      console.log('⚠️ Utilisateur n\'existe pas, création...');
      // Créer l'utilisateur
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'hello@nomad-lab.io',
        password: 'nomadlab123'
      });

      if (signUpError) {
        console.error('❌ Erreur lors de la création de l\'utilisateur:', signUpError.message);
        return;
      }

      userId = signUpData.user.id;
      console.log('✅ Utilisateur créé:', signUpData.user.email);
    } else {
      userId = signInData.user.id;
      console.log('✅ Utilisateur existant connecté:', signInData.user.email);
    }

    // 2. Créer ou récupérer le shop
    console.log('\n2️⃣ Création/récupération du shop...');
    const { data: existingShops, error: shopsError } = await supabase
      .from('shops')
      .select('*')
      .eq('email', 'hello@nomad-lab.io');

    if (shopsError) throw shopsError;

    let shop;
    if (existingShops && existingShops.length > 0) {
      shop = existingShops[0];
      console.log('✅ Shop existant récupéré:', shop.name);
    } else {
      // Créer le shop
      const { data: newShop, error: newShopError } = await supabase
        .from('shops')
        .insert({
          email: 'hello@nomad-lab.io',
          name: 'Nomad Lab Auto Care',
          address_line1: '15 Rue de la Paix',
          address_city: 'Paris',
          business_type: 'local'
        })
        .select()
        .single();

      if (newShopError) throw newShopError;
      shop = newShop;
      console.log('✅ Shop créé:', shop.name);
    }

    // 3. Créer les tailles de véhicules
    console.log('\n3️⃣ Création des tailles de véhicules...');
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

    // 4. Créer les catégories de services
    console.log('\n4️⃣ Création des catégories de services...');
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

    // 5. Créer les services
    console.log('\n5️⃣ Création des services...');
    const services = [
      // Nettoyage Intérieur
      {
        shop_id: shop.id,
        category_id: createdCategories[0].id,
        name: 'Nettoyage Intérieur Complet',
        description: 'Aspiration complète, nettoyage des sièges, tableau de bord, portières et coffre. Produits écologiques et techniques professionnelles.',
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
        name: 'Nettoyage Sièges Spécialisé',
        description: 'Nettoyage spécialisé des sièges en tissu ou cuir. Élimination des taches et protection écologique.',
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
            name: 'Formule Cuir Premium',
            additionalPrice: 1000,
            additionalDuration: 15,
            features: [
              'Nettoyage cuir spécialisé',
              'Conditioning cuir écologique',
              'Protection UV naturelle'
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
        name: 'Lavage Extérieur Écologique',
        description: 'Lavage haute pression, décontamination, nettoyage jantes et pneumatiques. Produits biodégradables et techniques respectueuses.',
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
            name: 'Formule Brillance Naturelle',
            additionalPrice: 2000,
            additionalDuration: 25,
            features: [
              'Cire liquide écologique',
              'Nettoyage jantes décontamination',
              'Traitement pneumatiques naturel',
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
        description: 'Élimination des particules de fer et de la rouille. Protection de la peinture avec produits écologiques.',
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
        name: 'Traitement Céramique Écologique',
        description: 'Application d\'un revêtement céramique écologique pour une protection longue durée et un éclat exceptionnel.',
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
              'Éclat renforcé',
              'Produits 100% écologiques'
            ]
          },
          {
            name: 'Céramique 12 mois Premium',
            additionalPrice: 5000,
            additionalDuration: 60,
            features: [
              'Protection 12 mois',
              'Facilité d\'entretien maximale',
              'Éclat exceptionnel',
              'Garantie étendue',
              'Produits premium écologiques'
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

    // 6. Créer les add-ons
    console.log('\n6️⃣ Création des add-ons...');
    const addOns = [
      {
        shop_id: shop.id,
        service_id: createdServices[0].id, // Nettoyage Intérieur Complet
        name: 'Désodorisation Ozone',
        description: 'Élimination complète des odeurs avec traitement ozone écologique',
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
        service_id: createdServices[2].id, // Lavage Extérieur Écologique
        name: 'Cire Carnauba Naturelle',
        description: 'Application de cire carnauba premium pour un éclat naturel',
        price: 2500, // 25€
        duration: 25,
        order: 1,
        is_active: true
      },
      {
        shop_id: shop.id,
        service_id: createdServices[2].id,
        name: 'Nettoyage Moteur Écologique',
        description: 'Nettoyage sécurisé du compartiment moteur avec produits biodégradables',
        price: 3000, // 30€
        duration: 35,
        order: 2,
        is_active: true
      },
      {
        shop_id: shop.id,
        service_id: createdServices[4].id, // Traitement Céramique Écologique
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

    // 7. Créer les horaires d'ouverture
    console.log('\n7️⃣ Création des horaires d\'ouverture...');
    const openingHours = [
      { shop_id: shop.id, weekday: 1, frames: [{ start: '09:00', end: '18:00' }] }, // Lundi
      { shop_id: shop.id, weekday: 2, frames: [{ start: '09:00', end: '18:00' }] }, // Mardi
      { shop_id: shop.id, weekday: 3, frames: [{ start: '09:00', end: '18:00' }] }, // Mercredi
      { shop_id: shop.id, weekday: 4, frames: [{ start: '09:00', end: '18:00' }] }, // Jeudi
      { shop_id: shop.id, weekday: 5, frames: [{ start: '09:00', end: '18:00' }] }, // Vendredi
      { shop_id: shop.id, weekday: 6, frames: [{ start: '09:00', end: '17:00' }] }, // Samedi
      { shop_id: shop.id, weekday: 0, frames: [] } // Dimanche fermé
    ];

    const { error: hoursError } = await supabase
      .from('opening_hours')
      .upsert(openingHours, { onConflict: 'shop_id,weekday' });

    if (hoursError) throw hoursError;
    console.log('✅ Horaires d\'ouverture créés');

    console.log('\n🎉 Seeding terminé avec succès !');
    console.log('\n📋 Résumé des données créées:');
    console.log(`   👤 Utilisateur: hello@nomad-lab.io (mot de passe: nomadlab123)`);
    console.log(`   🏪 Shop: ${shop.name} (${shop.slug})`);
    console.log(`   🚗 Tailles de véhicules: ${createdVehicleSizes.length}`);
    console.log(`   📂 Catégories: ${createdCategories.length}`);
    console.log(`   🧽 Services: ${createdServices.length}`);
    console.log(`   ➕ Add-ons: ${createdAddOns.length}`);
    console.log(`   🕒 Horaires: 7 jours configurés`);
    console.log(`\n🔗 URL de test: http://localhost:5174/${shop.slug}`);
    console.log(`\n🔑 Connexion dashboard: http://localhost:5174/dashboard`);

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Exécuter le seeding
seedNomadLabData();
