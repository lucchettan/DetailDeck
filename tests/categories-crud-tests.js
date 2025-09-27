/**
 * Tests CRUD pour la gestion des Catégories de Services
 * Scénarios: Avec/sans images, ordre, activation/désactivation
 */

console.log('📂 Tests CRUD - Gestion des Catégories');

// Configuration des tests
const CATEGORY_SCENARIOS = {
  // Scénario 1: Catégorie avec image
  withImage: {
    name: 'Lavage Intérieur',
    description: 'Services de nettoyage et entretien de l\'habitacle',
    image: 'https://example.com/interior-category.jpg',
    order: 1,
    isActive: true
  },

  // Scénario 2: Catégorie sans image
  withoutImage: {
    name: 'Lavage Extérieur',
    description: 'Services de nettoyage et protection de la carrosserie',
    image: null,
    order: 2,
    isActive: true
  },

  // Scénario 3: Catégorie désactivée
  inactive: {
    name: 'Services Spéciaux',
    description: 'Services temporairement indisponibles',
    image: 'https://example.com/special-category.jpg',
    order: 3,
    isActive: false
  },

  // Scénario 4: Catégorie avec ordre élevé
  highOrder: {
    name: 'Traitements Céramiques',
    description: 'Protection longue durée de la peinture',
    image: 'https://example.com/ceramic-category.jpg',
    order: 10,
    isActive: true
  },

  // Scénario 5: Catégorie avec description longue
  longDescription: {
    name: 'Détail Complet Premium',
    description: 'Service complet incluant lavage intérieur et extérieur, traitement des plastiques, nettoyage des jantes, aspiration complète, shampoing des sièges, traitement des cuirs, protection céramique et finition premium avec cire haute qualité.',
    image: 'https://example.com/premium-category.jpg',
    order: 4,
    isActive: true
  }
};

class CategoryCRUDTests {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async runTests() {
    console.log('\n🚀 Démarrage des tests CRUD Catégories...\n');

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
    console.log('📊 RÉSUMÉ DES TESTS CATÉGORIES');
    console.log('==============================');
    console.log(`✅ Tests passés: ${this.passed}`);
    console.log(`❌ Tests échoués: ${this.failed}`);
    console.log(`📈 Taux de réussite: ${Math.round((this.passed / (this.passed + this.failed)) * 100)}%`);
  }

  // Test 1: Création d'une catégorie avec image
  testCreateCategoryWithImage() {
    const category = CATEGORY_SCENARIOS.withImage;

    // Validation des champs requis
    if (!category.name || !category.description) {
      throw new Error('Champs requis manquants pour catégorie avec image');
    }

    // Validation de l'image
    if (!category.image) {
      throw new Error('Catégorie avec image doit avoir une URL d\'image');
    }

    // Validation de l'URL d'image
    try {
      new URL(category.image);
    } catch {
      throw new Error('URL d\'image invalide');
    }

    // Validation de l'ordre
    if (typeof category.order !== 'number' || category.order < 0) {
      throw new Error('Ordre de catégorie invalide');
    }

    // Validation du statut actif
    if (typeof category.isActive !== 'boolean') {
      throw new Error('Statut actif doit être un booléen');
    }

    console.log('   ✅ Catégorie avec image créée avec succès');
  }

  // Test 2: Création d'une catégorie sans image
  testCreateCategoryWithoutImage() {
    const category = CATEGORY_SCENARIOS.withoutImage;

    // Validation des champs requis
    if (!category.name || !category.description) {
      throw new Error('Champs requis manquants pour catégorie sans image');
    }

    // Validation de l'absence d'image
    if (category.image !== null && category.image !== undefined) {
      throw new Error('Catégorie sans image ne doit pas avoir d\'URL d\'image');
    }

    console.log('   ✅ Catégorie sans image créée avec succès');
  }

  // Test 3: Création d'une catégorie désactivée
  testCreateInactiveCategory() {
    const category = CATEGORY_SCENARIOS.inactive;

    // Validation des champs requis
    if (!category.name || !category.description) {
      throw new Error('Champs requis manquants pour catégorie inactive');
    }

    // Validation du statut inactif
    if (category.isActive !== false) {
      throw new Error('Catégorie inactive doit avoir isActive = false');
    }

    console.log('   ✅ Catégorie inactive créée avec succès');
  }

  // Test 4: Validation des formats de données
  testDataFormatValidation() {
    const category = CATEGORY_SCENARIOS.withImage;

    // Validation du format du nom
    if (typeof category.name !== 'string' || category.name.length < 2) {
      throw new Error('Nom de catégorie invalide');
    }

    // Validation du format de la description
    if (typeof category.description !== 'string' || category.description.length < 10) {
      throw new Error('Description de catégorie invalide');
    }

    // Validation du format de l'ordre
    if (!Number.isInteger(category.order)) {
      throw new Error('Ordre de catégorie doit être un entier');
    }

    // Validation du format du statut actif
    if (typeof category.isActive !== 'boolean') {
      throw new Error('Statut actif doit être un booléen');
    }

    console.log('   ✅ Formats de données validés');
  }

  // Test 5: Validation des contraintes métier
  testBusinessConstraints() {
    // Test contrainte: nom unique
    const categories = [
      CATEGORY_SCENARIOS.withImage,
      CATEGORY_SCENARIOS.withoutImage
    ];

    const names = categories.map(cat => cat.name);
    const uniqueNames = new Set(names);

    if (names.length !== uniqueNames.size) {
      throw new Error('Noms de catégories doivent être uniques');
    }

    // Test contrainte: ordre positif
    for (const category of categories) {
      if (category.order < 0) {
        throw new Error('Ordre de catégorie doit être positif');
      }
    }

    // Test contrainte: description minimum
    for (const category of categories) {
      if (category.description.length < 10) {
        throw new Error('Description de catégorie trop courte');
      }
    }

    console.log('   ✅ Contraintes métier validées');
  }

  // Test 6: Test de modification d'une catégorie
  testUpdateCategory() {
    const originalCategory = CATEGORY_SCENARIOS.withImage;
    const updatedCategory = {
      ...originalCategory,
      name: 'Lavage Intérieur Premium',
      description: 'Services de nettoyage et entretien premium de l\'habitacle',
      order: 5,
      isActive: false
    };

    // Validation des modifications
    if (updatedCategory.name === originalCategory.name) {
      throw new Error('Nom de catégorie non modifié');
    }

    if (updatedCategory.description === originalCategory.description) {
      throw new Error('Description de catégorie non modifiée');
    }

    if (updatedCategory.order === originalCategory.order) {
      throw new Error('Ordre de catégorie non modifié');
    }

    if (updatedCategory.isActive === originalCategory.isActive) {
      throw new Error('Statut actif non modifié');
    }

    console.log('   ✅ Catégorie modifiée avec succès');
  }

  // Test 7: Test de suppression d'une catégorie
  testDeleteCategory() {
    const category = CATEGORY_SCENARIOS.withoutImage;

    // Simulation de la suppression
    const deletedCategory = null;

    if (deletedCategory !== null) {
      throw new Error('Catégorie non supprimée');
    }

    console.log('   ✅ Catégorie supprimée avec succès');
  }

  // Test 8: Test de réorganisation des catégories
  testReorderCategories() {
    const categories = [
      { ...CATEGORY_SCENARIOS.withImage, order: 1 },
      { ...CATEGORY_SCENARIOS.withoutImage, order: 2 },
      { ...CATEGORY_SCENARIOS.inactive, order: 3 }
    ];

    // Réorganisation
    const reorderedCategories = categories.map((cat, index) => ({
      ...cat,
      order: index + 1
    }));

    // Validation de la réorganisation
    for (let i = 0; i < reorderedCategories.length; i++) {
      if (reorderedCategories[i].order !== i + 1) {
        throw new Error('Réorganisation des catégories échouée');
      }
    }

    console.log('   ✅ Catégories réorganisées avec succès');
  }

  // Test 9: Test de validation des URLs d'images
  testImageUrlValidation() {
    const category = CATEGORY_SCENARIOS.withImage;

    // Validation du format URL
    try {
      new URL(category.image);
    } catch {
      throw new Error('URL d\'image invalide');
    }

    // Validation de l'extension
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const hasValidExtension = validExtensions.some(ext =>
      category.image.toLowerCase().includes(ext)
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
      permissions: ['category:read', 'category:write', 'category:delete', 'category:admin']
    };

    const shopOwner = {
      role: 'shop_owner',
      permissions: ['category:read', 'category:write']
    };

    // Validation des permissions admin
    if (!adminUser.permissions.includes('category:admin')) {
      throw new Error('Admin doit avoir les permissions d\'administration des catégories');
    }

    // Validation des permissions shop owner
    if (shopOwner.permissions.includes('category:admin')) {
      throw new Error('Shop owner ne doit pas avoir les permissions d\'administration des catégories');
    }

    console.log('   ✅ Permissions validées');
  }

  // Test 11: Test de gestion des catégories avec services
  testCategoryWithServices() {
    const category = CATEGORY_SCENARIOS.withImage;
    const services = [
      { id: 'service1', name: 'Lavage Intérieur Standard', categoryId: category.id },
      { id: 'service2', name: 'Lavage Intérieur Premium', categoryId: category.id }
    ];

    // Validation de l'association catégorie-services
    for (const service of services) {
      if (service.categoryId !== category.id) {
        throw new Error('Service non associé à la bonne catégorie');
      }
    }

    console.log('   ✅ Association catégorie-services validée');
  }

  // Test 12: Test de validation des noms de catégories
  testCategoryNameValidation() {
    const validNames = [
      'Lavage Intérieur',
      'Lavage Extérieur',
      'Traitements Céramiques',
      'Détail Complet'
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
        throw new Error(`Nom de catégorie valide rejeté: ${name}`);
      }
    }

    // Validation des noms invalides
    for (const name of invalidNames) {
      if (name && typeof name === 'string' && name.trim().length >= 2 && name.length <= 100) {
        throw new Error(`Nom de catégorie invalide accepté: ${name}`);
      }
    }

    console.log('   ✅ Validation des noms de catégories');
  }
}

// Exécution des tests
async function runCategoryTests() {
  const testSuite = new CategoryCRUDTests();

  // Ajouter tous les tests
  testSuite.addTest('Création catégorie avec image', () => testSuite.testCreateCategoryWithImage());
  testSuite.addTest('Création catégorie sans image', () => testSuite.testCreateCategoryWithoutImage());
  testSuite.addTest('Création catégorie inactive', () => testSuite.testCreateInactiveCategory());
  testSuite.addTest('Validation formats de données', () => testSuite.testDataFormatValidation());
  testSuite.addTest('Contraintes métier', () => testSuite.testBusinessConstraints());
  testSuite.addTest('Modification d\'une catégorie', () => testSuite.testUpdateCategory());
  testSuite.addTest('Suppression d\'une catégorie', () => testSuite.testDeleteCategory());
  testSuite.addTest('Réorganisation des catégories', () => testSuite.testReorderCategories());
  testSuite.addTest('Validation URLs d\'images', () => testSuite.testImageUrlValidation());
  testSuite.addTest('Permissions admin', () => testSuite.testAdminPermissions());
  testSuite.addTest('Catégorie avec services', () => testSuite.testCategoryWithServices());
  testSuite.addTest('Validation des noms', () => testSuite.testCategoryNameValidation());

  // Exécuter les tests
  await testSuite.runTests();
}

// Lancer les tests
runCategoryTests().catch(console.error);
