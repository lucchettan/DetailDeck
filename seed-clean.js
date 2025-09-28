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

async function seedClean() {
  console.log('🌱 Seeding propre...');

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

  // 3. Nettoyer tout d'abord
  console.log('\n🧹 Nettoyage...');
  await supabase.from('addons').delete().eq('shop_id', shop.id);
  await supabase.from('services').delete().eq('shop_id', shop.id);
  await supabase.from('shop_service_categories').delete().eq('shop_id', shop.id);
  await supabase.from('shop_vehicle_sizes').delete().eq('shop_id', shop.id);
  console.log('✅ Nettoyage terminé');

  // 4. Créer les tailles de véhicules
  console.log('\n🚗 Création des tailles...');
  const { data: vehicleSizes } = await supabase
    .from('shop_vehicle_sizes')
    .insert([
      { shop_id: shop.id, name: 'Citadine/Compacte' },
      { shop_id: shop.id, name: 'Berline/SUV moyen' },
      { shop_id: shop.id, name: 'SUV/4x4 grand format' }
    ])
    .select();
  console.log('✅ Tailles créées:', vehicleSizes.length);

  // 5. Créer les catégories
  console.log('\n📂 Création des catégories...');
  const { data: categories } = await supabase
    .from('shop_service_categories')
    .insert([
      { shop_id: shop.id, name: 'Nettoyage Intérieur', is_active: true },
      { shop_id: shop.id, name: 'Nettoyage Extérieur', is_active: true },
      { shop_id: shop.id, name: 'Prestations Premium', is_active: true }
    ])
    .select();
  console.log('✅ Catégories créées:', categories.length);

  // 6. Créer les services
  console.log('\n🧽 Création des services...');
  const { data: services } = await supabase
    .from('services')
    .insert([
      {
        shop_id: shop.id,
        category_id: categories[0].id,
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
            includedItems: ['Shampoing tapis', 'Plastiques satinés', 'Traitement cuir']
          }
        ],
        is_active: true
      },
      {
        shop_id: shop.id,
        category_id: categories[1].id,
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
        category_id: categories[2].id,
        name: 'Traitement Céramique',
        description: 'Protection longue durée de la carrosserie.',
        base_price: 15000,
        base_duration: 180,
        image_urls: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop'],
        vehicle_size_variations: {},
        formulas: [
          {
            name: 'Céramique 6 mois',
            additionalPrice: 0,
            additionalDuration: 0,
            includedItems: ['Protection 6 mois', 'Facilité d\'entretien', 'Éclat renforcé']
          }
        ],
        is_active: true
      }
    ])
    .select();
  console.log('✅ Services créés:', services.length);

  // 7. Créer les add-ons
  console.log('\n➕ Création des add-ons...');
  const { data: addons } = await supabase
    .from('addons')
    .insert([
      {
        shop_id: shop.id,
        service_id: services[0].id,
        name: 'Désodorisation',
        description: 'Élimination des mauvaises odeurs.',
        price: 1500,
        duration: 15,
        is_active: true
      },
      {
        shop_id: shop.id,
        service_id: services[1].id,
        name: 'Traitement Jantes',
        description: 'Nettoyage et protection des jantes.',
        price: 2000,
        duration: 20,
        is_active: true
      }
    ])
    .select();
  console.log('✅ Add-ons créés:', addons.length);

  console.log('\n🎉 Seeding terminé !');
  console.log(`🔗 URL: http://localhost:5174/${shop.slug || 'nomad-lab-auto-care'}`);
}

seedClean().catch(console.error);
