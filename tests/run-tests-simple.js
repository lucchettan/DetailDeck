/**
 * Script simple pour exécuter tous les tests CRUD
 * Version simplifiée sans spawn pour éviter les problèmes de modules
 */

console.log('🚀 Tests CRUD - DetailDeck');
console.log('===========================\n');

// Fonction pour exécuter un test
async function runTest(testName, testFile) {
  console.log(`\n📋 ${testName}`);
  console.log('='.repeat(50));

  try {
    // Import dynamique
    const testModule = await import(`./${testFile}`);
    console.log(`✅ ${testName} - TERMINÉ\n`);
    return { success: true, name: testName };
  } catch (error) {
    console.log(`❌ ${testName} - ÉCHOUÉ: ${error.message}\n`);
    return { success: false, name: testName, error: error.message };
  }
}

// Fonction principale
async function runAllTests() {
  const tests = [
    { name: 'Tests d\'intégration de base de données', file: 'database-integration-tests.js' },
    { name: 'Tests CRUD Shops', file: 'shop-crud-tests.js' },
    { name: 'Tests CRUD Catégories', file: 'categories-crud-tests.js' },
    { name: 'Tests CRUD Tailles de Véhicules', file: 'vehicle-sizes-crud-tests.js' },
    { name: 'Tests CRUD Services', file: 'services-crud-tests.js' },
    { name: 'Tests CRUD Réservations', file: 'reservations-crud-tests.js' }
  ];

  const results = [];

  for (const test of tests) {
    const result = await runTest(test.name, test.file);
    results.push(result);
  }

  // Rapport final
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const successRate = Math.round((successful / results.length) * 100);

  console.log('\n' + '='.repeat(60));
  console.log('📊 RAPPORT FINAL');
  console.log('='.repeat(60));
  console.log(`✅ Tests réussis: ${successful}`);
  console.log(`❌ Tests échoués: ${failed}`);
  console.log(`📈 Taux de réussite: ${successRate}%`);

  if (failed > 0) {
    console.log('\n❌ Tests échoués:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  }

  console.log('\n🎯 FONCTIONNALITÉS TESTÉES:');
  console.log('----------------------------');
  console.log('🏪 Shops: Local, Mobile, Hybride, Sans images');
  console.log('📂 Catégories: Avec/sans images, Ordre, Activation');
  console.log('🚗 Tailles de Véhicules: Avec/sans images, Descriptions');
  console.log('🛠️ Services: Formules, Add-ons, Modificateurs de taille');
  console.log('📅 Réservations: Statuts, Permissions, Calculs');

  console.log('\n🔄 PROCHAINES ÉTAPES:');
  console.log('---------------------');
  console.log('1. Tester sur une base de données réelle');
  console.log('2. Valider les flux complets');
  console.log('3. Tester les performances');
  console.log('4. Valider la sécurité et permissions');

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Tests terminés!');
  console.log('='.repeat(60));
}

// Lancer les tests
runAllTests().catch(console.error);

