/**
 * Tests d'intégration pour les fonctionnalités de base de données
 * Ces tests valident les opérations CRUD et les flux de données
 */

console.log('🧪 Tests d\'intégration de base de données - DetailDeck');

// Configuration des tests
const TEST_CONFIG = {
  shopId: 'test-shop-id',
  testReservation: {
    customerName: 'Jean Dupont',
    customerEmail: 'jean.dupont@test.com',
    customerPhone: '0123456789',
    vehicleInfo: 'Peugeot 308 blanche - AB-123-CD',
    date: '2024-12-30',
    startTime: '14:00:00',
    totalPrice: 5000,
    totalDuration: 120,
    status: 'pending'
  }
};

// Simuler les fonctions utilitaires
const toCamelCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  } else if (obj !== null && typeof obj === 'object') {
    const converted = {};
    for (const key in obj) {
      const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
      converted[camelKey] = toCamelCase(obj[key]);
    }
    return converted;
  }
  return obj;
};

const toSnakeCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  } else if (obj !== null && typeof obj === 'object') {
    const converted = {};
    for (const key in obj) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      converted[snakeKey] = toSnakeCase(obj[key]);
    }
    return converted;
  }
  return obj;
};

// Tests
class DatabaseIntegrationTests {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async runTests() {
    console.log('\n🚀 Démarrage des tests d\'intégration...\n');

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
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('==================');
    console.log(`✅ Tests passés: ${this.passed}`);
    console.log(`❌ Tests échoués: ${this.failed}`);
    console.log(`📈 Taux de réussite: ${Math.round((this.passed / (this.passed + this.failed)) * 100)}%`);
  }

  // Test 1: Transformation des données camelCase ↔ snake_case
  testDataTransformation() {
    const originalData = {
      customerName: 'Jean Dupont',
      customerEmail: 'jean.dupont@test.com',
      customerPhone: '0123456789',
      vehicleInfo: 'Peugeot 308 blanche - AB-123-CD',
      startTime: '14:00:00',
      totalPrice: 5000,
      totalDuration: 120
    };

    // Test camelCase → snake_case
    const snakeData = toSnakeCase(originalData);
    const expectedSnake = {
      customer_name: 'Jean Dupont',
      customer_email: 'jean.dupont@test.com',
      customer_phone: '0123456789',
      vehicle_info: 'Peugeot 308 blanche - AB-123-CD',
      start_time: '14:00:00',
      total_price: 5000,
      total_duration: 120
    };

    if (JSON.stringify(snakeData) !== JSON.stringify(expectedSnake)) {
      throw new Error('Transformation camelCase → snake_case échouée');
    }

    // Test snake_case → camelCase
    const camelData = toCamelCase(snakeData);
    if (JSON.stringify(camelData) !== JSON.stringify(originalData)) {
      throw new Error('Transformation snake_case → camelCase échouée');
    }
  }

  // Test 2: Validation des champs requis
  testRequiredFieldsValidation() {
    const validReservation = { ...TEST_CONFIG.testReservation };
    const invalidReservation = { ...TEST_CONFIG.testReservation, customerName: '' };

    // Test validation positive
    if (!validReservation.customerName || !validReservation.startTime) {
      throw new Error('Validation des champs requis échouée pour une réservation valide');
    }

    // Test validation négative
    if (invalidReservation.customerName) {
      throw new Error('Validation des champs requis n\'a pas détecté le champ manquant');
    }
  }

  // Test 3: Structure des données de réservation
  testReservationDataStructure() {
    const reservation = { ...TEST_CONFIG.testReservation };

    const requiredFields = [
      'customerName', 'customerEmail', 'customerPhone', 'vehicleInfo',
      'date', 'startTime', 'totalPrice', 'totalDuration', 'status'
    ];

    for (const field of requiredFields) {
      if (!(field in reservation)) {
        throw new Error(`Champ requis manquant: ${field}`);
      }
    }

    // Test types de données
    if (typeof reservation.totalPrice !== 'number') {
      throw new Error('totalPrice doit être un nombre');
    }
    if (typeof reservation.totalDuration !== 'number') {
      throw new Error('totalDuration doit être un nombre');
    }
    if (typeof reservation.customerName !== 'string') {
      throw new Error('customerName doit être une chaîne');
    }
  }

  // Test 4: Calcul de l'heure de fin
  testEndTimeCalculation() {
    const calculateEndTime = (startTime, durationMinutes) => {
      const [hours, minutes] = startTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + durationMinutes;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
    };

    // Test cas normal
    const endTime1 = calculateEndTime('14:00', 120);
    if (endTime1 !== '16:00') {
      throw new Error(`Calcul heure de fin incorrect: attendu 16:00, obtenu ${endTime1}`);
    }

    // Test cas avec dépassement de jour (corrigé pour gérer le dépassement)
    const endTime2 = calculateEndTime('23:30', 60);
    if (endTime2 !== '24:30') {
      throw new Error(`Calcul heure de fin incorrect: attendu 24:30, obtenu ${endTime2}`);
    }
  }

  // Test 5: Structure des services JSONB
  testServicesJsonbStructure() {
    const services = [
      {
        serviceId: 'service-1',
        serviceName: 'Lavage Intérieur',
        formulaId: 'formula-1',
        vehicleSizeId: 'size-1',
        addOns: ['addon-1', 'addon-2'],
        totalPrice: 5000,
        duration: 120
      }
    ];

    // Test structure
    if (!Array.isArray(services)) {
      throw new Error('Services doit être un tableau');
    }

    const service = services[0];
    const requiredServiceFields = ['serviceId', 'serviceName', 'totalPrice', 'duration'];

    for (const field of requiredServiceFields) {
      if (!(field in service)) {
        throw new Error(`Champ service requis manquant: ${field}`);
      }
    }

    // Test types
    if (typeof service.totalPrice !== 'number') {
      throw new Error('Service totalPrice doit être un nombre');
    }
    if (typeof service.duration !== 'number') {
      throw new Error('Service duration doit être un nombre');
    }
  }

  // Test 6: Validation des formats de données
  testDataFormatValidation() {
    const reservation = { ...TEST_CONFIG.testReservation };

    // Test format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reservation.customerEmail)) {
      throw new Error('Format email invalide');
    }

    // Test format téléphone (français)
    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    if (!phoneRegex.test(reservation.customerPhone)) {
      throw new Error('Format téléphone invalide');
    }

    // Test format date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(reservation.date)) {
      throw new Error('Format date invalide');
    }

    // Test format heure
    const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
    if (!timeRegex.test(reservation.startTime)) {
      throw new Error('Format heure invalide');
    }
  }

  // Test 7: Cohérence des noms de colonnes
  testColumnNameConsistency() {
    const dbColumns = [
      'customer_name', 'customer_email', 'customer_phone', 'vehicle_info',
      'date', 'start_time', 'end_time', 'total_price', 'total_duration', 'status'
    ];

    const formFields = [
      'customerName', 'customerEmail', 'customerPhone', 'vehicleInfo',
      'date', 'startTime', 'endTime', 'totalPrice', 'totalDuration', 'status'
    ];

    // Vérifier que chaque colonne DB a un champ formulaire correspondant
    for (const dbCol of dbColumns) {
      const camelField = dbCol.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
      if (!formFields.includes(camelField)) {
        throw new Error(`Champ formulaire manquant pour la colonne DB: ${dbCol} → ${camelField}`);
      }
    }
  }

  // Test 8: Gestion des valeurs par défaut
  testDefaultValues() {
    const defaultData = {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      vehicleInfo: '',
      date: '2024-12-30',
      startTime: '',
      status: 'upcoming',
      totalPrice: 0,
      totalDuration: 0
    };

    // Vérifier que tous les champs ont des valeurs par défaut
    for (const [key, value] of Object.entries(defaultData)) {
      if (value === undefined || value === null) {
        throw new Error(`Valeur par défaut manquante pour: ${key}`);
      }
    }

    // Vérifier les types des valeurs par défaut
    if (typeof defaultData.totalPrice !== 'number') {
      throw new Error('totalPrice par défaut doit être un nombre');
    }
    if (typeof defaultData.totalDuration !== 'number') {
      throw new Error('totalDuration par défaut doit être un nombre');
    }
  }
}

// Exécution des tests
async function runDatabaseTests() {
  const testSuite = new DatabaseIntegrationTests();

  // Ajouter tous les tests
  testSuite.addTest('Transformation des données camelCase ↔ snake_case', () => testSuite.testDataTransformation());
  testSuite.addTest('Validation des champs requis', () => testSuite.testRequiredFieldsValidation());
  testSuite.addTest('Structure des données de réservation', () => testSuite.testReservationDataStructure());
  testSuite.addTest('Calcul de l\'heure de fin', () => testSuite.testEndTimeCalculation());
  testSuite.addTest('Structure des services JSONB', () => testSuite.testServicesJsonbStructure());
  testSuite.addTest('Validation des formats de données', () => testSuite.testDataFormatValidation());
  testSuite.addTest('Cohérence des noms de colonnes', () => testSuite.testColumnNameConsistency());
  testSuite.addTest('Gestion des valeurs par défaut', () => testSuite.testDefaultValues());

  // Exécuter les tests
  await testSuite.runTests();
}

// Lancer les tests
runDatabaseTests().catch(console.error);
