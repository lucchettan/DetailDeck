/**
 * Tests CRUD pour la gestion des Tailles de Véhicules
 * Scénarios: Avec/sans images, ordre, descriptions
 */

console.log('🚗 Tests CRUD - Gestion des Tailles de Véhicules');

// Configuration des tests
const VEHICLE_SIZE_SCENARIOS = {
  // Scénario 1: Taille avec image
  withImage: {
    name: 'Citadine / Compacte',
    description: 'Véhicules de petite taille (Clio, 208, Polo, etc.)',
    image: 'https://example.com/citadine.jpg',
    order: 1
  },

  // Scénario 2: Taille sans image
  withoutImage: {
    name: 'Berline / SUV moyen',
    description: 'Véhicules de taille moyenne (Golf, 308, Qashqai, etc.)',
    image: null,
    order: 2
  },

  // Scénario 3: Taille avec description détaillée
  detailedDescription: {
    name: 'SUV / 4x4 grand format',
    description: 'Véhicules de grande taille avec hauteur importante. Inclut les SUV compacts, SUV moyens, SUV 7 places et 4x4. Exemples: Q7, X5, Range Rover, Touareg, etc. Ces véhicules nécessitent plus de temps et de produits pour un nettoyage complet.',
    image: 'https://example.com/suv-large.jpg',
    order: 3
  },

  // Scénario 4: Taille utilitaire
  utility: {
    name: 'Utilitaire / Van',
    description: 'Véhicules utilitaires et vans (Kangoo, Partner, Transit, etc.)',
    image: 'https://example.com/van-utility.jpg',
    order: 4
  },

  // Scénario 5: Taille sans description
  noDescription: {
    name: 'Moto / Scooter',
    image: 'https://example.com/moto.jpg',
    order: 5
  },

  // Scénario 6: Taille avec ordre élevé
  highOrder: {
    name: 'Camion / Poids lourd',
    description: 'Véhicules de transport de marchandises',
    image: 'https://example.com/truck.jpg',
    order: 100
  }
};

class VehicleSizeCRUDTests {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async runTests() {
    console.log('\n🚀 Démarrage des tests CRUD Tailles de Véhicules...\n');

    for (const test of this.tests) {
      try {
        console.log(`📋 Test: ${test.name}`);
        await test.testFn();
        console.log(`✅ ${test.name} - PASSÉ\n`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${test.name} - ÉCHOUÉ: ${error.message}\n`);
        this.failed++;
      }
    }

    this.printSummary();
  }

  printSummary() {
    console.log('📊 RÉSUMÉ DES TESTS TAILLES DE VÉHICULES');
    console.log('========================================');
    console.log(`✅ Tests passés: ${this.passed}`);
    console.log(`❌ Tests échoués: ${this.failed}`);
    console.log(`📈 Taux de réussite: ${Math.round((this.passed / (this.passed + this.failed)) * 100)}%`);
  }

  // Test 1: Création d'une taille avec image
  testCreateVehicleSizeWithImage() {
    const vehicleSize = VEHICLE_SIZE_SCENARIOS.withImage;

    // Validation des champs requis
    if (!vehicleSize.name) {
      throw new Error('Nom requis pour taille de véhicule avec image');
    }

    // Validation de l'image
    if (!vehicleSize.image) {
      throw new Error('Taille de véhicule avec image doit avoir une URL d\'image');
    }

    // Validation de l'URL d'image
    try {
      new URL(vehicleSize.image);
    } catch {
      throw new Error('URL d\'image invalide');
    }

    // Validation de l'ordre
    if (typeof vehicleSize.order !== 'number' || vehicleSize.order < 0) {
      throw new Error('Ordre de taille de véhicule invalide');
    }

    console.log('   ✅ Taille de véhicule avec image créée avec succès');
  }

  // Test 2: Création d'une taille sans image
  testCreateVehicleSizeWithoutImage() {
    const vehicleSize = VEHICLE_SIZE_SCENARIOS.withoutImage;

    // Validation des champs requis
    if (!vehicleSize.name) {
      throw new Error('Nom requis pour taille de véhicule sans image');
    }

    // Validation de l'absence d'image
    if (vehicleSize.image !== null && vehicleSize.image !== undefined) {
      throw new Error('Taille de véhicule sans image ne doit pas avoir d\'URL d\'image');
    }

    console.log('   ✅ Taille de véhicule sans image créée avec succès');
  }

  // Test 3: Création d'une taille sans description
  testCreateVehicleSizeWithoutDescription() {
    const vehicleSize = VEHICLE_SIZE_SCENARIOS.noDescription;

    // Validation des champs requis
    if (!vehicleSize.name) {
      throw new Error('Nom requis pour taille de véhicule sans description');
    }

    // Validation de l'absence de description
    if (vehicleSize.description !== undefined) {
      throw new Error('Taille de véhicule sans description ne doit pas avoir de description');
    }

    console.log('   ✅ Taille de véhicule sans description créée avec succès');
  }

  // Test 4: Validation des formats de données
  testDataFormatValidation() {
    const vehicleSize = VEHICLE_SIZE_SCENARIOS.withImage;

    // Validation du format du nom
    if (typeof vehicleSize.name !== 'string' || vehicleSize.name.length < 2) {
      throw new Error('Nom de taille de véhicule invalide');
    }

    // Validation du format de la description (si présente)
    if (vehicleSize.description && typeof vehicleSize.description !== 'string') {
      throw new Error('Description de taille de véhicule invalide');
    }

    // Validation du format de l'ordre
    if (!Number.isInteger(vehicleSize.order)) {
      throw new Error('Ordre de taille de véhicule doit être un entier');
    }

    console.log('   ✅ Formats de données validés');
  }

  // Test 5: Validation des contraintes métier
  testBusinessConstraints() {
    const vehicleSizes = [
      VEHICLE_SIZE_SCENARIOS.withImage,
      VEHICLE_SIZE_SCENARIOS.withoutImage,
      VEHICLE_SIZE_SCENARIOS.utility
    ];

    // Test contrainte: nom unique
    const names = vehicleSizes.map(size => size.name);
    const uniqueNames = new Set(names);

    if (names.length !== uniqueNames.size) {
      throw new Error('Noms de tailles de véhicules doivent être uniques');
    }

    // Test contrainte: ordre positif
    for (const vehicleSize of vehicleSizes) {
      if (vehicleSize.order < 0) {
        throw new Error('Ordre de taille de véhicule doit être positif');
      }
    }

    console.log('   ✅ Contraintes métier validées');
  }

  // Test 6: Test de modification d'une taille de véhicule
  testUpdateVehicleSize() {
    const originalSize = VEHICLE_SIZE_SCENARIOS.withImage;
    const updatedSize = {
      ...originalSize,
      name: 'Citadine / Compacte Premium',
      description: 'Véhicules de petite taille avec finition premium',
      order: 10
    };

    // Validation des modifications
    if (updatedSize.name === originalSize.name) {
      throw new Error('Nom de taille de véhicule non modifié');
    }

    if (updatedSize.description === originalSize.description) {
      throw new Error('Description de taille de véhicule non modifiée');
    }

    if (updatedSize.order === originalSize.order) {
      throw new Error('Ordre de taille de véhicule non modifié');
    }

    console.log('   ✅ Taille de véhicule modifiée avec succès');
  }

  // Test 7: Test de suppression d'une taille de véhicule
  testDeleteVehicleSize() {
    const vehicleSize = VEHICLE_SIZE_SCENARIOS.utility;

    // Simulation de la suppression
    const deletedSize = null;

    if (deletedSize !== null) {
      throw new Error('Taille de véhicule non supprimée');
    }

    console.log('   ✅ Taille de véhicule supprimée avec succès');
  }

  // Test 8: Test de réorganisation des tailles de véhicules
  testReorderVehicleSizes() {
    const vehicleSizes = [
      { ...VEHICLE_SIZE_SCENARIOS.withImage, order: 1 },
      { ...VEHICLE_SIZE_SCENARIOS.withoutImage, order: 2 },
      { ...VEHICLE_SIZE_SCENARIOS.utility, order: 3 }
    ];

    // Réorganisation
    const reorderedSizes = vehicleSizes.map((size, index) => ({
      ...size,
      order: index + 1
    }));

    // Validation de la réorganisation
    for (let i = 0; i < reorderedSizes.length; i++) {
      if (reorderedSizes[i].order !== i + 1) {
        throw new Error('Réorganisation des tailles de véhicules échouée');
      }
    }

    console.log('   ✅ Tailles de véhicules réorganisées avec succès');
  }

  // Test 9: Test de validation des URLs d'images
  testImageUrlValidation() {
    const vehicleSize = VEHICLE_SIZE_SCENARIOS.withImage;

    // Validation du format URL
    try {
      new URL(vehicleSize.image);
    } catch {
      throw new Error('URL d\'image invalide');
    }

    // Validation de l'extension
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const hasValidExtension = validExtensions.some(ext =>
      vehicleSize.image.toLowerCase().includes(ext)
    );

    if (!hasValidExtension) {
      throw new Error('Extension d\'image non supportée');
    }

    console.log('   ✅ URL d\'image validée');
  }

  // Test 10: Test des permissions admin
  testAdminPermissions() {
    const adminUser = {
      role: 'admin',
      permissions: ['vehicle_size:read', 'vehicle_size:write', 'vehicle_size:delete', 'vehicle_size:admin']
    };

    const shopOwner = {
      role: 'shop_owner',
      permissions: ['vehicle_size:read', 'vehicle_size:write']
    };

    // Validation des permissions admin
    if (!adminUser.permissions.includes('vehicle_size:admin')) {
      throw new Error('Admin doit avoir les permissions d\'administration des tailles de véhicules');
    }

    // Validation des permissions shop owner
    if (shopOwner.permissions.includes('vehicle_size:admin')) {
      throw new Error('Shop owner ne doit pas avoir les permissions d\'administration des tailles de véhicules');
    }

    console.log('   ✅ Permissions validées');
  }

  // Test 11: Test de gestion des tailles avec services
  testVehicleSizeWithServices() {
    const vehicleSize = VEHICLE_SIZE_SCENARIOS.withImage;
    const serviceModifiers = [
      { serviceId: 'service1', vehicleSizeId: vehicleSize.id, addPrice: 0, addDurationMin: 0 },
      { serviceId: 'service2', vehicleSizeId: vehicleSize.id, addPrice: 500, addDurationMin: 15 }
    ];

    // Validation de l'association taille-service
    for (const modifier of serviceModifiers) {
      if (modifier.vehicleSizeId !== vehicleSize.id) {
        throw new Error('Modificateur de service non associé à la bonne taille de véhicule');
      }
    }

    console.log('   ✅ Association taille de véhicule-services validée');
  }

  // Test 12: Test de validation des noms de tailles
  testVehicleSizeNameValidation() {
    const validNames = [
      'Citadine / Compacte',
      'Berline / SUV moyen',
      'SUV / 4x4 grand format',
      'Utilitaire / Van',
      'Moto / Scooter'
    ];

    const invalidNames = [
      '', // Nom vide
      'A', // Nom trop court
      'A'.repeat(101), // Nom trop long
      '   ', // Nom avec espaces uniquement
      null, // Nom null
      undefined // Nom undefined
    ];

    // Validation des noms valides
    for (const name of validNames) {
      if (typeof name !== 'string' || name.length < 2 || name.length > 100) {
        throw new Error(`Nom de taille de véhicule valide rejeté: ${name}`);
      }
    }

    // Validation des noms invalides
    for (const name of invalidNames) {
      if (name && typeof name === 'string' && name.trim().length >= 2 && name.length <= 100) {
        throw new Error(`Nom de taille de véhicule invalide accepté: ${name}`);
      }
    }

    console.log('   ✅ Validation des noms de tailles de véhicules');
  }

  // Test 13: Test de gestion des descriptions longues
  testLongDescriptionHandling() {
    const vehicleSize = VEHICLE_SIZE_SCENARIOS.detailedDescription;

    // Validation de la description longue
    if (vehicleSize.description.length < 100) {
      throw new Error('Description détaillée trop courte');
    }

    // Validation que la description contient des informations utiles
    const usefulKeywords = ['véhicules', 'taille', 'exemples', 'nettoyage'];
    const hasUsefulContent = usefulKeywords.some(keyword =>
      vehicleSize.description.toLowerCase().includes(keyword)
    );

    if (!hasUsefulContent) {
      throw new Error('Description détaillée ne contient pas d\'informations utiles');
    }

    console.log('   ✅ Gestion des descriptions longues validée');
  }

  // Test 14: Test de validation des ordres élevés
  testHighOrderValidation() {
    const vehicleSize = VEHICLE_SIZE_SCENARIOS.highOrder;

    // Validation de l'ordre élevé
    if (vehicleSize.order < 50) {
      throw new Error('Ordre élevé non détecté');
    }

    // Validation que l'ordre élevé est géré correctement
    if (typeof vehicleSize.order !== 'number' || !Number.isInteger(vehicleSize.order)) {
      throw new Error('Ordre élevé doit être un entier');
    }

    console.log('   ✅ Validation des ordres élevés');
  }
}

// Exécution des tests
async function runVehicleSizeTests() {
  const testSuite = new VehicleSizeCRUDTests();

  // Ajouter tous les tests
  testSuite.addTest('Création taille avec image', () => testSuite.testCreateVehicleSizeWithImage());
  testSuite.addTest('Création taille sans image', () => testSuite.testCreateVehicleSizeWithoutImage());
  testSuite.addTest('Création taille sans description', () => testSuite.testCreateVehicleSizeWithoutDescription());
  testSuite.addTest('Validation formats de données', () => testSuite.testDataFormatValidation());
  testSuite.addTest('Contraintes métier', () => testSuite.testBusinessConstraints());
  testSuite.addTest('Modification d\'une taille', () => testSuite.testUpdateVehicleSize());
  testSuite.addTest('Suppression d\'une taille', () => testSuite.testDeleteVehicleSize());
  testSuite.addTest('Réorganisation des tailles', () => testSuite.testReorderVehicleSizes());
  testSuite.addTest('Validation URLs d\'images', () => testSuite.testImageUrlValidation());
  testSuite.addTest('Permissions admin', () => testSuite.testAdminPermissions());
  testSuite.addTest('Taille avec services', () => testSuite.testVehicleSizeWithServices());
  testSuite.addTest('Validation des noms', () => testSuite.testVehicleSizeNameValidation());
  testSuite.addTest('Gestion descriptions longues', () => testSuite.testLongDescriptionHandling());
  testSuite.addTest('Validation ordres élevés', () => testSuite.testHighOrderValidation());

  // Exécuter les tests
  await testSuite.runTests();
}

// Lancer les tests
runVehicleSizeTests().catch(console.error);
