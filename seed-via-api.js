/**
 * Script de seeding via l'API de l'application
 * Utilise les endpoints existants pour créer les données
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Charger les variables d'environnement
const envContent = readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function seedViaAPI() {
  console.log('🌱 Seeding via API...\n');

  try {
    // 1. Se connecter avec le compte existant
    console.log('1️⃣ Connexion avec hello@nomad-lab.io...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'hello@nomad-lab.io',
      password: 'Potager12'
    });

    if (authError) {
      console.error('❌ Erreur de connexion:', authError.message);
      return;
    }

    console.log('✅ Connecté:', authData.user.email);

    // 2. Créer le shop via l'API
    console.log('\n2️⃣ Création du shop...');
    const shopData = {
      email: 'hello@nomad-lab.io',
      name: 'Nomad Lab Auto Care',
      address_line1: '15 Rue de la Paix',
      address_city: 'Paris',
      business_type: 'local'
    };

    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .insert(shopData)
      .select()
      .single();

    if (shopError) {
      console.log('⚠️ Shop existe peut-être déjà:', shopError.message);
      // Récupérer le shop existant
      const { data: existingShop } = await supabase
        .from('shops')
        .select('*')
        .eq('email', 'hello@nomad-lab.io')
        .single();

      if (existingShop) {
        console.log('✅ Shop existant récupéré:', existingShop.name);
        shop = existingShop;
      } else {
        throw shopError;
      }
    } else {
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

    for (const size of vehicleSizes) {
      const { error } = await supabase
        .from('shop_vehicle_sizes')
        .upsert(size, { onConflict: 'shop_id,name' });

      if (error) {
        console.log('⚠️ Erreur taille véhicule:', error.message);
      }
    }
    console.log('✅ Tailles de véhicules créées');

    // 4. Créer les catégories
    console.log('\n4️⃣ Création des catégories...');
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

    const createdCategories = [];
    for (const category of categories) {
      const { data, error } = await supabase
        .from('shop_service_categories')
        .upsert(category, { onConflict: 'shop_id,name' })
        .select()
        .single();

      if (error) {
        console.log('⚠️ Erreur catégorie:', error.message);
      } else {
        createdCategories.push(data);
      }
    }
    console.log('✅ Catégories créées:', createdCategories.length);

    // 5. Créer les services
    console.log('\n5️⃣ Création des services...');
    const services = [
      {
        shop_id: shop.id,
        category_id: createdCategories[0].id,
        name: 'Nettoyage Intérieur Complet',
        description: 'Aspiration complète, nettoyage des sièges, tableau de bord, portières et coffre.',
        base_price: 4500,
        base_duration: 90,
        image_urls: [
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'
        ],
        vehicle_size_variations: {},
        formulas: [
          {
            name: 'Formule Confort',
            additionalPrice: 1500,
            additionalDuration: 20,
            features: ['Shampoing tapis', 'Plastiques satinés', 'Traitement cuir']
          }
        ],
        order: 1,
        is_active: true
      },
      {
        shop_id: shop.id,
        category_id: createdCategories[1].id,
        name: 'Lavage Extérieur Complet',
        description: 'Lavage haute pression, décontamination, nettoyage jantes et pneumatiques.',
        base_price: 3500,
        base_duration: 60,
        image_urls: [
          'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop'
        ],
        vehicle_size_variations: {},
        formulas: [],
        order: 1,
        is_active: true
      }
    ];

    const createdServices = [];
    for (const service of services) {
      const { data, error } = await supabase
        .from('services')
        .upsert(service, { onConflict: 'shop_id,name' })
        .select()
        .single();

      if (error) {
        console.log('⚠️ Erreur service:', error.message);
      } else {
        createdServices.push(data);
      }
    }
    console.log('✅ Services créés:', createdServices.length);

    console.log('\n🎉 Seeding terminé !');
    console.log(`🔗 URL: http://localhost:5174/nomad-lab-auto-care`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

seedViaAPI();
