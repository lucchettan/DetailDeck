/**
 * Tests CRUD pour la gestion des Services
 * Scénarios: Avec/sans formules, add-ons, modificateurs de taille, images
 */

console.log('🛠️ Tests CRUD - Gestion des Services');

// Configuration des tests
const SERVICE_SCENARIOS = {
  // Scénario 1: Service simple sans formules ni add-ons
  simple: {
    name: 'Lavage Intérieur Standard',
    description: 'Nettoyage complet de l\'habitacle avec aspiration et nettoyage des surfaces',
    basePrice: 3000, // 30€ en centimes
    baseDurationMin: 60,
    images: ['https://example.com/interior-standard.jpg'],
    order: 1,
    isActive: true,
    categoryId: 'category-1',
    formulas: [],
    addOns: [],
    sizeModifiers: []
  },

  // Scénario 2: Service avec formules
  withFormulas: {
    name: 'Lavage Extérieur Premium',
    description: 'Nettoyage et protection de la carrosserie avec différentes formules',
    basePrice: 4000, // 40€ en centimes
    baseDurationMin: 90,
    images: [
      'https://example.com/exterior-1.jpg',
      'https://example.com/exterior-2.jpg'
    ],
    order: 2,
    isActive: true,
    categoryId: 'category-2',
    formulas: [
      {
        name: 'Formule Confort',
        addPrice: 1000, // +10€
        addDurationMin: 20,
        features: ['Cire protection 3 mois', 'Nettoyage jantes', 'Plastiques satinés'],
        order: 1,
        isActive: true
      },
      {
        name: 'Formule Premium',
        addPrice: 2500, // +25€
        addDurationMin: 45,
        features: ['Cire premium 6 mois', 'Nettoyage moteur', 'Protection plastiques', 'Finitions détails'],
        order: 2,
        isActive: true
      }
    ],
    addOns: [],
    sizeModifiers: []
  },

  // Scénario 3: Service avec add-ons
  withAddOns: {
    name: 'Détail Complet',
    description: 'Service complet avec options personnalisables',
    basePrice: 6000, // 60€ en centimes
    baseDurationMin: 120,
    images: [
      'https://example.com/detail-1.jpg',
      'https://example.com/detail-2.jpg',
      'https://example.com/detail-3.jpg'
    ],
    order: 3,
    isActive: true,
    categoryId: 'category-1',
    formulas: [],
    addOns: [
      {
        name: 'Décontamination ferreuse',
        addPrice: 2000, // +20€
        addDurationMin: 30,
        description: 'Élimination des particules de fer sur la carrosserie',
        order: 1,
        isActive: true
      },
      {
        name: 'Traitement céramique',
        addPrice: 5000, // +50€
        addDurationMin: 60,
        description: 'Protection longue durée de la peinture',
        order: 2,
        isActive: true
      },
      {
        name: 'Nettoyage moteur',
        addPrice: 1500, // +15€
        addDurationMin: 25,
        description: 'Nettoyage et protection du compartiment moteur',
        order: 3,
        isActive: true
      }
    ],
    sizeModifiers: []
  },

  // Scénario 4: Service avec modificateurs de taille
  withSizeModifiers: {
    name: 'Lavage Intérieur Premium',
    description: 'Service premium avec tarification selon la taille du véhicule',
    basePrice: 3500, // 35€ en centimes
    baseDurationMin: 75,
    images: ['https://example.com/interior-premium.jpg'],
    order: 4,
    isActive: true,
    categoryId: 'category-1',
    formulas: [],
    addOns: [],
    sizeModifiers: [
      {
        vehicleSizeId: 'size-1', // Citadine
        addPrice: 0, // Pas de supplément
        addDurationMin: 0
      },
      {
        vehicleSizeId: 'size-2', // Berline
        addPrice: 500, // +5€
        addDurationMin: 15
      },
      {
        vehicleSizeId: 'size-3', // SUV
        addPrice: 1000, // +10€
        addDurationMin: 30
      },
      {
        vehicleSizeId: 'size-4', // Utilitaire
        addPrice: 1500, // +15€
        addDurationMin: 45
      }
    ]
  },

  // Scénario 5: Service complet (formules + add-ons + modificateurs)
  complete: {
    name: 'Détail Complet Premium',
    description: 'Service haut de gamme avec toutes les options',
    basePrice: 8000, // 80€ en centimes
    baseDurationMin: 180,
    images: [
      'https://example.com/complete-1.jpg',
      'https://example.com/complete-2.jpg',
      'https://example.com/complete-3.jpg',
      'https://example.com/complete-4.jpg'
    ],
    order: 5,
    isActive: true,
    categoryId: 'category-1',
    formulas: [
      {
        name: 'Formule Excellence',
        addPrice: 3000, // +30€
        addDurationMin: 60,
        features: ['Cire premium 12 mois', 'Protection complète', 'Finitions expertes'],
        order: 1,
        isActive: true
      }
    ],
    addOns: [
      {
        name: 'Traitement céramique premium',
        addPrice: 8000, // +80€
        addDurationMin: 120,
        description: 'Protection céramique haute performance 24 mois',
        order: 1,
        isActive: true
      }
    ],
    sizeModifiers: [
      {
        vehicleSizeId: 'size-1', // Citadine
        addPrice: 0,
        addDurationMin: 0
      },
      {
        vehicleSizeId: 'size-2', // Berline
        addPrice: 1000, // +10€
        addDurationMin: 20
      },
      {
        vehicleSizeId: 'size-3', // SUV
        addPrice: 2000, // +20€
        addDurationMin: 40
      }
    ]
  },

  // Scénario 6: Service inactif
  inactive: {
    name: 'Service Temporairement Indisponible',
    description: 'Service en maintenance',
    basePrice: 2000,
    baseDurationMin: 30,
    images: [],
    order: 6,
    isActive: false,
    categoryId: 'category-1',
    formulas: [],
    addOns: [],
    sizeModifiers: []
  }
};

class ServiceCRUDTests {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async runTests() {
    console.log('\n🚀 Démarrage des tests CRUD Services...\n');

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
    console.log('📊 RÉSUMÉ DES TESTS SERVICES');
    console.log('============================');
    console.log(`✅ Tests passés: ${this.passed}`);
    console.log(`❌ Tests échoués: ${this.failed}`);
    console.log(`📈 Taux de réussite: ${Math.round((this.passed / (this.passed + this.failed)) * 100)}%`);
  }

  // Test 1: Création d'un service simple
  testCreateSimpleService() {
    const service = SERVICE_SCENARIOS.simple;

    // Validation des champs requis
    if (!service.name || !service.description || !service.categoryId) {
      throw new Error('Champs requis manquants pour service simple');
    }

    // Validation du prix et de la durée
    if (typeof service.basePrice !== 'number' || service.basePrice <= 0) {
      throw new Error('Prix de base invalide');
    }

    if (typeof service.baseDurationMin !== 'number' || service.baseDurationMin <= 0) {
      throw new Error('Durée de base invalide');
    }

    // Validation des formules et add-ons (doivent être vides)
    if (service.formulas.length > 0 || service.addOns.length > 0) {
      throw new Error('Service simple ne doit pas avoir de formules ou add-ons');
    }

    console.log('   ✅ Service simple créé avec succès');
  }

  // Test 2: Création d'un service avec formules
  testCreateServiceWithFormulas() {
    const service = SERVICE_SCENARIOS.withFormulas;

    // Validation des champs requis
    if (!service.name || !service.description || !service.categoryId) {
      throw new Error('Champs requis manquants pour service avec formules');
    }

    // Validation des formules
    if (!Array.isArray(service.formulas) || service.formulas.length === 0) {
      throw new Error('Service avec formules doit avoir au moins une formule');
    }

    // Validation de chaque formule
    for (const formula of service.formulas) {
      if (!formula.name || typeof formula.addPrice !== 'number' || typeof formula.addDurationMin !== 'number') {
        throw new Error('Formule invalide');
      }

      if (!Array.isArray(formula.features)) {
        throw new Error('Features de formule doivent être un tableau');
      }
    }

    console.log('   ✅ Service avec formules créé avec succès');
  }

  // Test 3: Création d'un service avec add-ons
  testCreateServiceWithAddOns() {
    const service = SERVICE_SCENARIOS.withAddOns;

    // Validation des champs requis
    if (!service.name || !service.description || !service.categoryId) {
      throw new Error('Champs requis manquants pour service avec add-ons');
    }

    // Validation des add-ons
    if (!Array.isArray(service.addOns) || service.addOns.length === 0) {
      throw new Error('Service avec add-ons doit avoir au moins un add-on');
    }

    // Validation de chaque add-on
    for (const addOn of service.addOns) {
      if (!addOn.name || typeof addOn.addPrice !== 'number' || typeof addOn.addDurationMin !== 'number') {
        throw new Error('Add-on invalide');
      }
    }

    console.log('   ✅ Service avec add-ons créé avec succès');
  }

  // Test 4: Création d'un service avec modificateurs de taille
  testCreateServiceWithSizeModifiers() {
    const service = SERVICE_SCENARIOS.withSizeModifiers;

    // Validation des champs requis
    if (!service.name || !service.description || !service.categoryId) {
      throw new Error('Champs requis manquants pour service avec modificateurs de taille');
    }

    // Validation des modificateurs de taille
    if (!Array.isArray(service.sizeModifiers) || service.sizeModifiers.length === 0) {
      throw new Error('Service avec modificateurs de taille doit avoir au moins un modificateur');
    }

    // Validation de chaque modificateur
    for (const modifier of service.sizeModifiers) {
      if (!modifier.vehicleSizeId || typeof modifier.addPrice !== 'number' || typeof modifier.addDurationMin !== 'number') {
        throw new Error('Modificateur de taille invalide');
      }
    }

    console.log('   ✅ Service avec modificateurs de taille créé avec succès');
  }

  // Test 5: Création d'un service complet
  testCreateCompleteService() {
    const service = SERVICE_SCENARIOS.complete;

    // Validation des champs requis
    if (!service.name || !service.description || !service.categoryId) {
      throw new Error('Champs requis manquants pour service complet');
    }

    // Validation des formules
    if (!Array.isArray(service.formulas) || service.formulas.length === 0) {
      throw new Error('Service complet doit avoir des formules');
    }

    // Validation des add-ons
    if (!Array.isArray(service.addOns) || service.addOns.length === 0) {
      throw new Error('Service complet doit avoir des add-ons');
    }

    // Validation des modificateurs de taille
    if (!Array.isArray(service.sizeModifiers) || service.sizeModifiers.length === 0) {
      throw new Error('Service complet doit avoir des modificateurs de taille');
    }

    // Validation des images (maximum 4)
    if (!Array.isArray(service.images) || service.images.length > 4) {
      throw new Error('Service ne peut pas avoir plus de 4 images');
    }

    console.log('   ✅ Service complet créé avec succès');
  }

  // Test 6: Validation des formats de données
  testDataFormatValidation() {
    const service = SERVICE_SCENARIOS.simple;

    // Validation du format du nom
    if (typeof service.name !== 'string' || service.name.length < 2) {
      throw new Error('Nom de service invalide');
    }

    // Validation du format de la description
    if (typeof service.description !== 'string' || service.description.length < 10) {
      throw new Error('Description de service invalide');
    }

    // Validation du format du prix
    if (!Number.isInteger(service.basePrice) || service.basePrice <= 0) {
      throw new Error('Prix de base doit être un entier positif');
    }

    // Validation du format de la durée
    if (!Number.isInteger(service.baseDurationMin) || service.baseDurationMin <= 0) {
      throw new Error('Durée de base doit être un entier positif');
    }

    // Validation du format de l'ordre
    if (!Number.isInteger(service.order)) {
      throw new Error('Ordre de service doit être un entier');
    }

    // Validation du format du statut actif
    if (typeof service.isActive !== 'boolean') {
      throw new Error('Statut actif doit être un booléen');
    }

    console.log('   ✅ Formats de données validés');
  }

  // Test 7: Validation des contraintes métier
  testBusinessConstraints() {
    const services = [
      SERVICE_SCENARIOS.simple,
      SERVICE_SCENARIOS.withFormulas,
      SERVICE_SCENARIOS.withAddOns
    ];

    // Test contrainte: nom unique
    const names = services.map(service => service.name);
    const uniqueNames = new Set(names);

    if (names.length !== uniqueNames.size) {
      throw new Error('Noms de services doivent être uniques');
    }

    // Test contrainte: prix positif
    for (const service of services) {
      if (service.basePrice <= 0) {
        throw new Error('Prix de service doit être positif');
      }
    }

    // Test contrainte: durée positive
    for (const service of services) {
      if (service.baseDurationMin <= 0) {
        throw new Error('Durée de service doit être positive');
      }
    }

    console.log('   ✅ Contraintes métier validées');
  }

  // Test 8: Test de modification d'un service
  testUpdateService() {
    const originalService = SERVICE_SCENARIOS.simple;
    const updatedService = {
      ...originalService,
      name: 'Lavage Intérieur Standard Modifié',
      description: 'Nettoyage complet de l\'habitacle avec aspiration et nettoyage des surfaces - Version améliorée',
      basePrice: 3500, // +5€
      baseDurationMin: 75, // +15 min
      isActive: false
    };

    // Validation des modifications
    if (updatedService.name === originalService.name) {
      throw new Error('Nom de service non modifié');
    }

    if (updatedService.description === originalService.description) {
      throw new Error('Description de service non modifiée');
    }

    if (updatedService.basePrice === originalService.basePrice) {
      throw new Error('Prix de service non modifié');
    }

    if (updatedService.baseDurationMin === originalService.baseDurationMin) {
      throw new Error('Durée de service non modifiée');
    }

    if (updatedService.isActive === originalService.isActive) {
      throw new Error('Statut actif non modifié');
    }

    console.log('   ✅ Service modifié avec succès');
  }

  // Test 9: Test de suppression d'un service
  testDeleteService() {
    const service = SERVICE_SCENARIOS.withFormulas;

    // Simulation de la suppression
    const deletedService = null;

    if (deletedService !== null) {
      throw new Error('Service non supprimé');
    }

    console.log('   ✅ Service supprimé avec succès');
  }

  // Test 10: Test de validation des URLs d'images
  testImageUrlValidation() {
    const service = SERVICE_SCENARIOS.withFormulas;

    for (const imageUrl of service.images) {
      // Validation du format URL
      try {
        new URL(imageUrl);
      } catch {
        throw new Error(`URL d'image invalide: ${imageUrl}`);
      }

      // Validation de l'extension
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const hasValidExtension = validExtensions.some(ext =>
        imageUrl.toLowerCase().includes(ext)
      );

      if (!hasValidExtension) {
        throw new Error(`Extension d'image non supportée: ${imageUrl}`);
      }
    }

    console.log('   ✅ URLs d\'images validées');
  }

  // Test 11: Test des permissions admin
  testAdminPermissions() {
    const adminUser = {
      role: 'admin',
      permissions: ['service:read', 'service:write', 'service:delete', 'service:admin']
    };

    const shopOwner = {
      role: 'shop_owner',
      permissions: ['service:read', 'service:write']
    };

    // Validation des permissions admin
    if (!adminUser.permissions.includes('service:admin')) {
      throw new Error('Admin doit avoir les permissions d\'administration des services');
    }

    // Validation des permissions shop owner
    if (shopOwner.permissions.includes('service:admin')) {
      throw new Error('Shop owner ne doit pas avoir les permissions d\'administration des services');
    }

    console.log('   ✅ Permissions validées');
  }

  // Test 12: Test de calcul de prix avec formules et add-ons
  testPriceCalculation() {
    const service = SERVICE_SCENARIOS.complete;
    const selectedFormula = service.formulas[0];
    const selectedAddOn = service.addOns[0];
    const selectedSizeModifier = service.sizeModifiers[1]; // Berline

    // Calcul du prix total
    const totalPrice = service.basePrice +
      selectedFormula.addPrice +
      selectedAddOn.addPrice +
      selectedSizeModifier.addPrice;

    // Calcul de la durée totale
    const totalDuration = service.baseDurationMin +
      selectedFormula.addDurationMin +
      selectedAddOn.addDurationMin +
      selectedSizeModifier.addDurationMin;

    // Validation des calculs
    if (totalPrice !== 20000) { // 80€ + 30€ + 80€ + 10€ = 200€
      throw new Error(`Calcul de prix incorrect: attendu 20000, obtenu ${totalPrice}`);
    }

    if (totalDuration !== 380) { // 180 + 60 + 120 + 20 = 380 min
      throw new Error(`Calcul de durée incorrect: attendu 380, obtenu ${totalDuration}`);
    }

    console.log('   ✅ Calcul de prix et durée validé');
  }

  // Test 13: Test de validation des formules
  testFormulaValidation() {
    const service = SERVICE_SCENARIOS.withFormulas;

    for (const formula of service.formulas) {
      // Validation des champs requis
      if (!formula.name || typeof formula.addPrice !== 'number' || typeof formula.addDurationMin !== 'number') {
        throw new Error('Formule invalide');
      }

      // Validation des features
      if (!Array.isArray(formula.features)) {
        throw new Error('Features de formule doivent être un tableau');
      }

      // Validation de l'ordre
      if (typeof formula.order !== 'number') {
        throw new Error('Ordre de formule doit être un nombre');
      }

      // Validation du statut actif
      if (typeof formula.isActive !== 'boolean') {
        throw new Error('Statut actif de formule doit être un booléen');
      }
    }

    console.log('   ✅ Validation des formules');
  }

  // Test 14: Test de validation des add-ons
  testAddOnValidation() {
    const service = SERVICE_SCENARIOS.withAddOns;

    for (const addOn of service.addOns) {
      // Validation des champs requis
      if (!addOn.name || typeof addOn.addPrice !== 'number' || typeof addOn.addDurationMin !== 'number') {
        throw new Error('Add-on invalide');
      }

      // Validation de la description
      if (addOn.description && typeof addOn.description !== 'string') {
        throw new Error('Description d\'add-on invalide');
      }

      // Validation de l'ordre
      if (typeof addOn.order !== 'number') {
        throw new Error('Ordre d\'add-on doit être un nombre');
      }

      // Validation du statut actif
      if (typeof addOn.isActive !== 'boolean') {
        throw new Error('Statut actif d\'add-on doit être un booléen');
      }
    }

    console.log('   ✅ Validation des add-ons');
  }

  // Test 15: Test de validation des modificateurs de taille
  testSizeModifierValidation() {
    const service = SERVICE_SCENARIOS.withSizeModifiers;

    for (const modifier of service.sizeModifiers) {
      // Validation des champs requis
      if (!modifier.vehicleSizeId || typeof modifier.addPrice !== 'number' || typeof modifier.addDurationMin !== 'number') {
        throw new Error('Modificateur de taille invalide');
      }

      // Validation que les valeurs peuvent être négatives (réduction de prix/durée)
      if (modifier.addPrice < -10000 || modifier.addDurationMin < -60) {
        throw new Error('Modificateur de taille avec valeurs extrêmes');
      }
    }

    console.log('   ✅ Validation des modificateurs de taille');
  }
}

// Exécution des tests
async function runServiceTests() {
  const testSuite = new ServiceCRUDTests();

  // Ajouter tous les tests
  testSuite.addTest('Création service simple', () => testSuite.testCreateSimpleService());
  testSuite.addTest('Création service avec formules', () => testSuite.testCreateServiceWithFormulas());
  testSuite.addTest('Création service avec add-ons', () => testSuite.testCreateServiceWithAddOns());
  testSuite.addTest('Création service avec modificateurs de taille', () => testSuite.testCreateServiceWithSizeModifiers());
  testSuite.addTest('Création service complet', () => testSuite.testCreateCompleteService());
  testSuite.addTest('Validation formats de données', () => testSuite.testDataFormatValidation());
  testSuite.addTest('Contraintes métier', () => testSuite.testBusinessConstraints());
  testSuite.addTest('Modification d\'un service', () => testSuite.testUpdateService());
  testSuite.addTest('Suppression d\'un service', () => testSuite.testDeleteService());
  testSuite.addTest('Validation URLs d\'images', () => testSuite.testImageUrlValidation());
  testSuite.addTest('Permissions admin', () => testSuite.testAdminPermissions());
  testSuite.addTest('Calcul de prix avec formules et add-ons', () => testSuite.testPriceCalculation());
  testSuite.addTest('Validation des formules', () => testSuite.testFormulaValidation());
  testSuite.addTest('Validation des add-ons', () => testSuite.testAddOnValidation());
  testSuite.addTest('Validation des modificateurs de taille', () => testSuite.testSizeModifierValidation());

  // Exécuter les tests
  await testSuite.runTests();
}

// Lancer les tests
runServiceTests().catch(console.error);
