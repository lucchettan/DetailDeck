/**
 * Script de seeding final - insert simple
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function seedFinal() {
  console.log('🌱 Seeding final...\n');

  try {
    // 1. Se connecter
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'hello@nomad-lab.io',
      password: 'Potager12'
    });

    if (authError) throw authError;
    console.log('✅ Connecté:', authData.user.email);

    // 2. Récupérer le shop
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('email', 'hello@nomad-lab.io')
      .single();

    if (shopError) throw shopError;
    console.log('✅ Shop récupéré:', shop.name);

    // 3. Créer les tailles de véhicules
    console.log('\n3️⃣ Création des tailles de véhicules...');
    const vehicleSizes = [
      { shop_id: shop.id, name: 'Citadine/Compacte' },
      { shop_id: shop.id, name: 'Berline/SUV moyen' },
      { shop_id: shop.id, name: 'SUV/4x4 grand format' }
    ];

    const { data: createdVehicleSizes, error: vehicleSizesError } = await supabase
      .from('shop_vehicle_sizes')
      .insert(vehicleSizes)
      .select();

    if (vehicleSizesError) {
      console.log('⚠️ Erreur tailles:', vehicleSizesError.message);
    } else {
      console.log('✅ Tailles créées:', createdVehicleSizes.length);
    }

    // 4. Créer les catégories
    console.log('\n4️⃣ Création des catégories...');
    const categories = [
      { shop_id: shop.id, name: 'Nettoyage Intérieur', is_active: true },
      { shop_id: shop.id, name: 'Nettoyage Extérieur', is_active: true },
      { shop_id: shop.id, name: 'Prestations Premium', is_active: true }
    ];

    const { data: createdCategories, error: categoriesError } = await supabase
      .from('shop_service_categories')
      .insert(categories)
      .select();

    if (categoriesError) {
      console.log('⚠️ Erreur catégories:', categoriesError.message);
    } else {
      console.log('✅ Catégories créées:', createdCategories.length);
    }

    // 5. Créer les services
    if (createdCategories && createdCategories.length > 0) {
      console.log('\n5️⃣ Création des services...');
      const services = [
        {
          shop_id: shop.id,
          category_id: createdCategories[0].id,
          name: 'Nettoyage Intérieur Complet',
          description: 'Aspiration complète, nettoyage des sièges, tableau de bord.',
          base_price: 4500,
          base_duration: 90,
          image_urls: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'],
          vehicle_size_variations: {},
          formulas: [
            {
              name: 'Formule Confort',
              additionalPrice: 1500,
              additionalDuration: 20,
              features: ['Shampoing tapis', 'Plastiques satinés', 'Traitement cuir']
            }
          ],
          is_active: true
        },
        {
          shop_id: shop.id,
          category_id: createdCategories[1].id,
          name: 'Lavage Extérieur Complet',
          description: 'Lavage haute pression, décontamination, nettoyage jantes.',
          base_price: 3500,
          base_duration: 60,
          image_urls: ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop'],
          vehicle_size_variations: {},
          formulas: [],
          is_active: true
        },
        {
          shop_id: shop.id,
          category_id: createdCategories[2].id,
          name: 'Traitement Céramique',
          description: 'Application d\'un revêtement céramique pour une protection longue durée.',
          base_price: 15000,
          base_duration: 180,
          image_urls: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop'],
          vehicle_size_variations: {},
          formulas: [
            {
              name: 'Céramique 6 mois',
              additionalPrice: 0,
              additionalDuration: 0,
              features: ['Protection 6 mois', 'Facilité d\'entretien', 'Éclat renforcé']
            }
          ],
          is_active: true
        }
      ];

      const { data: createdServices, error: servicesError } = await supabase
        .from('services')
        .insert(services)
        .select();

      if (servicesError) {
        console.log('⚠️ Erreur services:', servicesError.message);
      } else {
        console.log('✅ Services créés:', createdServices.length);

        // 6. Créer quelques add-ons
        if (createdServices && createdServices.length > 0) {
          console.log('\n6️⃣ Création des add-ons...');
          const addOns = [
            {
              shop_id: shop.id,
              service_id: createdServices[0].id,
              name: 'Désodorisation Ozone',
              description: 'Élimination complète des odeurs',
              price: 2000,
              duration: 30,
              is_active: true
            },
            {
              shop_id: shop.id,
              service_id: createdServices[1].id,
              name: 'Cire Carnauba',
              description: 'Application de cire premium',
              price: 2500,
              duration: 25,
              is_active: true
            }
          ];

          const { data: createdAddOns, error: addOnsError } = await supabase
            .from('addons')
            .insert(addOns)
            .select();

          if (addOnsError) {
            console.log('⚠️ Erreur add-ons:', addOnsError.message);
          } else {
            console.log('✅ Add-ons créés:', createdAddOns.length);
          }
        }
      }
    }

    console.log('\n🎉 Seeding terminé !');
    console.log(`🔗 URL: http://localhost:5174/nomad-lab-auto-care`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

seedFinal();
