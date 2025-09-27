/**
 * Test complet pour valider la gestion des réservations côté pro
 * - Création de réservations
 * - Édition de réservations
 * - Suppression de réservations
 * - Validation des contraintes minimales
 */

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase - Utiliser les vraies variables d'environnement
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://shxnokjzkfnreolujhew.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoeG5va2p6a2ZucmVvbHVqaGV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2MjQ5NjEsImV4cCI6MjA1MDIwMDk2MX0.8Q5qJ8Q5qJ8Q5qJ8Q5qJ8Q5qJ8Q5qJ8Q5qJ8Q5qJ8Q5qJ8';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test data
const testShopId = 'ed6198b7-8fbb-4d22-9f36-06e49eaa70cd';
const testServiceId = 'f32b07f0-a328-4714-84cf-1106716f0ed2';
const testVehicleSizeId = '550e8400-e29b-41d4-a716-446655440001';

let testReservationId = null;

console.log('🧪 Test Dashboard Réservations - Côté Pro');
console.log('==========================================');

// Test 1: Création d'une réservation
async function testCreateReservation() {
  console.log('\n📝 Test 1: Création d\'une réservation');

  const reservationData = {
    shop_id: testShopId,
    customer_name: 'Jean Dupont',
    customer_email: 'jean.dupont@test.com',
    customer_phone: '0123456789',
    vehicle_info: 'Peugeot 308 - AB-123-CD',
    date: '2024-12-15',
    start_time: '14:00',
    total_duration: 120,
    total_price: 80.00,
    status: 'upcoming',
    vehicle_size_id: testVehicleSizeId,
    services: [
      {
        serviceId: testServiceId,
        name: 'Nettoyage intérieur complet',
        price: 80.00,
        duration: 120,
        formulaId: null,
        addonIds: []
      }
    ]
  };

  try {
    const { data, error } = await supabase
      .from('reservations')
      .insert(reservationData)
      .select()
      .single();

    if (error) throw error;

    testReservationId = data.id;
    console.log('✅ Réservation créée avec succès:', data.id);
    console.log('   - Client:', data.customer_name);
    console.log('   - Date:', data.date);
    console.log('   - Heure:', data.start_time);
    console.log('   - Prix:', data.total_price);
    return true;
  } catch (error) {
    console.log('❌ Erreur lors de la création:', error.message);
    return false;
  }
}

// Test 2: Lecture d'une réservation
async function testReadReservation() {
  console.log('\n📖 Test 2: Lecture d\'une réservation');

  if (!testReservationId) {
    console.log('❌ Aucune réservation à lire');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', testReservationId)
      .single();

    if (error) throw error;

    console.log('✅ Réservation lue avec succès');
    console.log('   - ID:', data.id);
    console.log('   - Client:', data.customer_name);
    console.log('   - Services:', JSON.stringify(data.services, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Erreur lors de la lecture:', error.message);
    return false;
  }
}

// Test 3: Édition d'une réservation
async function testUpdateReservation() {
  console.log('\n✏️ Test 3: Édition d\'une réservation');

  if (!testReservationId) {
    console.log('❌ Aucune réservation à modifier');
    return false;
  }

  const updateData = {
    customer_name: 'Jean Dupont (Modifié)',
    customer_email: 'jean.dupont.modifie@test.com',
    customer_phone: '0987654321',
    vehicle_info: 'Peugeot 308 - AB-123-CD (Modifié)',
    start_time: '15:30',
    total_price: 100.00,
    services: [
      {
        serviceId: testServiceId,
        name: 'Nettoyage intérieur complet',
        price: 100.00,
        duration: 120,
        formulaId: null,
        addonIds: []
      }
    ]
  };

  try {
    const { data, error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', testReservationId)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Réservation modifiée avec succès');
    console.log('   - Nouveau nom:', data.customer_name);
    console.log('   - Nouveau email:', data.customer_email);
    console.log('   - Nouveau téléphone:', data.customer_phone);
    console.log('   - Nouvelle heure:', data.start_time);
    console.log('   - Nouveau prix:', data.total_price);
    return true;
  } catch (error) {
    console.log('❌ Erreur lors de la modification:', error.message);
    return false;
  }
}

// Test 4: Changement de statut
async function testUpdateStatus() {
  console.log('\n🔄 Test 4: Changement de statut');

  if (!testReservationId) {
    console.log('❌ Aucune réservation à modifier');
    return false;
  }

  const statuses = ['upcoming', 'completed', 'cancelled'];

  for (const status of statuses) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', testReservationId)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Statut changé vers '${status}' avec succès`);
    } catch (error) {
      console.log(`❌ Erreur lors du changement vers '${status}':`, error.message);
      return false;
    }
  }

  return true;
}

// Test 5: Validation des contraintes minimales
async function testMinimalConstraints() {
  console.log('\n⚖️ Test 5: Validation des contraintes minimales');

  // Test avec données minimales
  const minimalData = {
    shop_id: testShopId,
    customer_name: 'Client Minimal',
    date: '2024-12-16',
    start_time: '10:00',
    total_duration: 60,
    total_price: 50.00,
    status: 'upcoming'
  };

  try {
    const { data, error } = await supabase
      .from('reservations')
      .insert(minimalData)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Réservation avec données minimales créée');
    console.log('   - Client:', data.customer_name);
    console.log('   - Pas d\'email:', !data.customer_email);
    console.log('   - Pas de téléphone:', !data.customer_phone);
    console.log('   - Pas d\'info véhicule:', !data.vehicle_info);

    // Nettoyer
    await supabase.from('reservations').delete().eq('id', data.id);
    return true;
  } catch (error) {
    console.log('❌ Erreur avec données minimales:', error.message);
    return false;
  }
}

// Test 6: Suppression d'une réservation
async function testDeleteReservation() {
  console.log('\n🗑️ Test 6: Suppression d\'une réservation');

  if (!testReservationId) {
    console.log('❌ Aucune réservation à supprimer');
    return false;
  }

  try {
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', testReservationId);

    if (error) throw error;

    console.log('✅ Réservation supprimée avec succès');

    // Vérifier que la réservation n'existe plus
    const { data, error: checkError } = await supabase
      .from('reservations')
      .select('id')
      .eq('id', testReservationId)
      .single();

    if (checkError && checkError.code === 'PGRST116') {
      console.log('✅ Vérification: Réservation bien supprimée');
      return true;
    } else {
      console.log('❌ Erreur: Réservation encore présente');
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur lors de la suppression:', error.message);
    return false;
  }
}

// Test 7: Gestion des erreurs
async function testErrorHandling() {
  console.log('\n🚨 Test 7: Gestion des erreurs');

  // Test avec ID inexistant
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();

    if (error && error.code === 'PGRST116') {
      console.log('✅ Gestion correcte des IDs inexistants');
    } else {
      console.log('❌ Gestion incorrecte des IDs inexistants');
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur inattendue:', error.message);
    return false;
  }

  // Test avec données invalides
  try {
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        shop_id: 'invalid-uuid',
        customer_name: '',
        date: 'invalid-date',
        start_time: 'invalid-time'
      });

    if (error) {
      console.log('✅ Gestion correcte des données invalides');
      console.log('   - Erreur:', error.message);
    } else {
      console.log('❌ Données invalides acceptées');
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur inattendue:', error.message);
    return false;
  }

  return true;
}

// Exécution des tests
async function runAllTests() {
  const tests = [
    { name: 'Création', fn: testCreateReservation },
    { name: 'Lecture', fn: testReadReservation },
    { name: 'Édition', fn: testUpdateReservation },
    { name: 'Changement statut', fn: testUpdateStatus },
    { name: 'Contraintes minimales', fn: testMinimalConstraints },
    { name: 'Suppression', fn: testDeleteReservation },
    { name: 'Gestion erreurs', fn: testErrorHandling }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) passed++;
    } catch (error) {
      console.log(`❌ Test ${test.name} a échoué avec une exception:`, error.message);
    }
  }

  console.log('\n📊 Résultats des tests');
  console.log('======================');
  console.log(`✅ Tests réussis: ${passed}/${total}`);
  console.log(`❌ Tests échoués: ${total - passed}/${total}`);

  if (passed === total) {
    console.log('\n🎉 Tous les tests sont passés ! Le dashboard pro fonctionne parfaitement.');
  } else {
    console.log('\n⚠️ Certains tests ont échoué. Vérifiez les erreurs ci-dessus.');
  }
}

// Lancer les tests
runAllTests().catch(console.error);
