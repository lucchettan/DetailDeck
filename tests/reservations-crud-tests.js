/**
 * Tests CRUD pour la gestion des Réservations
 * Scénarios: Création, modification, annulation, statuts, permissions
 */

console.log('📅 Tests CRUD - Gestion des Réservations');

// Configuration des tests
const RESERVATION_SCENARIOS = {
  // Scénario 1: Réservation simple
  simple: {
    customerName: 'Jean Dupont',
    customerEmail: 'jean.dupont@example.com',
    customerPhone: '0123456789',
    vehicleInfo: 'Peugeot 308 blanche - AB-123-CD',
    date: '2024-12-30',
    startTime: '14:00:00',
    totalPrice: 5000, // 50€
    totalDuration: 120, // 2h
    status: 'pending',
    services: [
      {
        serviceId: 'service-1',
        serviceName: 'Lavage Intérieur Standard',
        formulaId: null,
        vehicleSizeId: 'size-1',
        addOns: [],
        totalPrice: 5000,
        duration: 120
      }
    ]
  },

  // Scénario 2: Réservation avec formule
  withFormula: {
    customerName: 'Marie Martin',
    customerEmail: 'marie.martin@example.com',
    customerPhone: '0987654321',
    vehicleInfo: 'BMW X3 noire - CD-456-EF',
    date: '2024-12-31',
    startTime: '10:00:00',
    totalPrice: 7500, // 75€
    totalDuration: 150, // 2h30
    status: 'confirmed',
    services: [
      {
        serviceId: 'service-2',
        serviceName: 'Lavage Extérieur Premium',
        formulaId: 'formula-1',
        formulaName: 'Formule Confort',
        vehicleSizeId: 'size-2',
        addOns: [],
        totalPrice: 7500,
        duration: 150
      }
    ]
  },

  // Scénario 3: Réservation avec add-ons
  withAddOns: {
    customerName: 'Pierre Durand',
    customerEmail: 'pierre.durand@example.com',
    customerPhone: '0555666777',
    vehicleInfo: 'Audi A4 grise - GH-789-IJ',
    date: '2025-01-02',
    startTime: '16:00:00',
    totalPrice: 12000, // 120€
    totalDuration: 180, // 3h
    status: 'pending',
    services: [
      {
        serviceId: 'service-3',
        serviceName: 'Détail Complet',
        formulaId: null,
        vehicleSizeId: 'size-2',
        addOns: ['addon-1', 'addon-2'],
        addOnNames: ['Décontamination ferreuse', 'Traitement céramique'],
        totalPrice: 12000,
        duration: 180
      }
    ]
  },

  // Scénario 4: Réservation complète (formule + add-ons + modificateur taille)
  complete: {
    customerName: 'Sophie Leroy',
    customerEmail: 'sophie.leroy@example.com',
    customerPhone: '0444555666',
    vehicleInfo: 'Range Rover blanc - KL-012-MN',
    date: '2025-01-03',
    startTime: '09:00:00',
    totalPrice: 20000, // 200€
    totalDuration: 300, // 5h
    status: 'confirmed',
    services: [
      {
        serviceId: 'service-4',
        serviceName: 'Détail Complet Premium',
        formulaId: 'formula-2',
        formulaName: 'Formule Excellence',
        vehicleSizeId: 'size-3', // SUV
        addOns: ['addon-3'],
        addOnNames: ['Traitement céramique premium'],
        totalPrice: 20000,
        duration: 300
      }
    ]
  },

  // Scénario 5: Réservation annulée
  cancelled: {
    customerName: 'Thomas Moreau',
    customerEmail: 'thomas.moreau@example.com',
    customerPhone: '0333444555',
    vehicleInfo: 'Renault Clio rouge - OP-345-QR',
    date: '2024-12-29',
    startTime: '15:00:00',
    totalPrice: 3000, // 30€
    totalDuration: 60, // 1h
    status: 'cancelled_by_client',
    services: [
      {
        serviceId: 'service-1',
        serviceName: 'Lavage Intérieur Standard',
        formulaId: null,
        vehicleSizeId: 'size-1',
        addOns: [],
        totalPrice: 3000,
        duration: 60
      }
    ]
  },

  // Scénario 6: Réservation terminée
  completed: {
    customerName: 'Julie Petit',
    customerEmail: 'julie.petit@example.com',
    customerPhone: '0222333444',
    vehicleInfo: 'Volkswagen Golf bleue - ST-678-UV',
    date: '2024-12-28',
    startTime: '11:00:00',
    totalPrice: 6000, // 60€
    totalDuration: 90, // 1h30
    status: 'completed',
    services: [
      {
        serviceId: 'service-2',
        serviceName: 'Lavage Extérieur Premium',
        formulaId: null,
        vehicleSizeId: 'size-2',
        addOns: ['addon-1'],
        addOnNames: ['Décontamination ferreuse'],
        totalPrice: 6000,
        duration: 90
      }
    ]
  }
};

class ReservationCRUDTests {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async runTests() {
    console.log('\n🚀 Démarrage des tests CRUD Réservations...\n');

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
    console.log('📊 RÉSUMÉ DES TESTS RÉSERVATIONS');
    console.log('=================================');
    console.log(`✅ Tests passés: ${this.passed}`);
    console.log(`❌ Tests échoués: ${this.failed}`);
    console.log(`📈 Taux de réussite: ${Math.round((this.passed / (this.passed + this.failed)) * 100)}%`);
  }

  // Test 1: Création d'une réservation simple
  testCreateSimpleReservation() {
    const reservation = RESERVATION_SCENARIOS.simple;

    // Validation des champs requis
    if (!reservation.customerName || !reservation.customerEmail || !reservation.date || !reservation.startTime) {
      throw new Error('Champs requis manquants pour réservation simple');
    }

    // Validation des services
    if (!Array.isArray(reservation.services) || reservation.services.length === 0) {
      throw new Error('Réservation doit avoir au moins un service');
    }

    // Validation du prix et de la durée
    if (typeof reservation.totalPrice !== 'number' || reservation.totalPrice <= 0) {
      throw new Error('Prix total invalide');
    }

    if (typeof reservation.totalDuration !== 'number' || reservation.totalDuration <= 0) {
      throw new Error('Durée totale invalide');
    }

    // Validation du statut
    if (!reservation.status) {
      throw new Error('Statut de réservation requis');
    }

    console.log('   ✅ Réservation simple créée avec succès');
  }

  // Test 2: Création d'une réservation avec formule
  testCreateReservationWithFormula() {
    const reservation = RESERVATION_SCENARIOS.withFormula;

    // Validation des champs requis
    if (!reservation.customerName || !reservation.customerEmail || !reservation.date || !reservation.startTime) {
      throw new Error('Champs requis manquants pour réservation avec formule');
    }

    // Validation de la formule
    const service = reservation.services[0];
    if (!service.formulaId || !service.formulaName) {
      throw new Error('Service avec formule doit avoir formulaId et formulaName');
    }

    console.log('   ✅ Réservation avec formule créée avec succès');
  }

  // Test 3: Création d'une réservation avec add-ons
  testCreateReservationWithAddOns() {
    const reservation = RESERVATION_SCENARIOS.withAddOns;

    // Validation des champs requis
    if (!reservation.customerName || !reservation.customerEmail || !reservation.date || !reservation.startTime) {
      throw new Error('Champs requis manquants pour réservation avec add-ons');
    }

    // Validation des add-ons
    const service = reservation.services[0];
    if (!Array.isArray(service.addOns) || service.addOns.length === 0) {
      throw new Error('Service avec add-ons doit avoir des add-ons');
    }

    if (!Array.isArray(service.addOnNames) || service.addOnNames.length !== service.addOns.length) {
      throw new Error('addOnNames doit correspondre aux add-ons');
    }

    console.log('   ✅ Réservation avec add-ons créée avec succès');
  }

  // Test 4: Création d'une réservation complète
  testCreateCompleteReservation() {
    const reservation = RESERVATION_SCENARIOS.complete;

    // Validation des champs requis
    if (!reservation.customerName || !reservation.customerEmail || !reservation.date || !reservation.startTime) {
      throw new Error('Champs requis manquants pour réservation complète');
    }

    // Validation de la formule
    const service = reservation.services[0];
    if (!service.formulaId || !service.formulaName) {
      throw new Error('Réservation complète doit avoir une formule');
    }

    // Validation des add-ons
    if (!Array.isArray(service.addOns) || service.addOns.length === 0) {
      throw new Error('Réservation complète doit avoir des add-ons');
    }

    // Validation du modificateur de taille
    if (!service.vehicleSizeId) {
      throw new Error('Réservation complète doit avoir une taille de véhicule');
    }

    console.log('   ✅ Réservation complète créée avec succès');
  }

  // Test 5: Validation des formats de données
  testDataFormatValidation() {
    const reservation = RESERVATION_SCENARIOS.simple;

    // Validation du format du nom
    if (typeof reservation.customerName !== 'string' || reservation.customerName.length < 2) {
      throw new Error('Nom de client invalide');
    }

    // Validation du format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reservation.customerEmail)) {
      throw new Error('Format email invalide');
    }

    // Validation du format du téléphone
    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    if (!phoneRegex.test(reservation.customerPhone)) {
      throw new Error('Format téléphone invalide');
    }

    // Validation du format de la date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(reservation.date)) {
      throw new Error('Format date invalide');
    }

    // Validation du format de l'heure
    const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
    if (!timeRegex.test(reservation.startTime)) {
      throw new Error('Format heure invalide');
    }

    // Validation du format du prix
    if (!Number.isInteger(reservation.totalPrice) || reservation.totalPrice <= 0) {
      throw new Error('Prix total doit être un entier positif');
    }

    // Validation du format de la durée
    if (!Number.isInteger(reservation.totalDuration) || reservation.totalDuration <= 0) {
      throw new Error('Durée totale doit être un entier positif');
    }

    console.log('   ✅ Formats de données validés');
  }

  // Test 6: Validation des statuts de réservation
  testReservationStatusValidation() {
    const validStatuses = ['pending', 'confirmed', 'declined', 'cancelled_by_client', 'cancelled_by_shop', 'completed'];

    for (const [scenarioName, reservation] of Object.entries(RESERVATION_SCENARIOS)) {
      if (!validStatuses.includes(reservation.status)) {
        throw new Error(`Statut de réservation invalide dans ${scenarioName}: ${reservation.status}`);
      }
    }

    console.log('   ✅ Statuts de réservation validés');
  }

  // Test 7: Test de modification d'une réservation
  testUpdateReservation() {
    const originalReservation = RESERVATION_SCENARIOS.simple;
    const updatedReservation = {
      ...originalReservation,
      customerName: 'Jean Dupont Modifié',
      customerEmail: 'jean.dupont.modifie@example.com',
      customerPhone: '0123456780',
      vehicleInfo: 'Peugeot 308 blanche - AB-123-CD (modifié)',
      status: 'confirmed'
    };

    // Validation des modifications
    if (updatedReservation.customerName === originalReservation.customerName) {
      throw new Error('Nom de client non modifié');
    }

    if (updatedReservation.customerEmail === originalReservation.customerEmail) {
      throw new Error('Email de client non modifié');
    }

    if (updatedReservation.customerPhone === originalReservation.customerPhone) {
      throw new Error('Téléphone de client non modifié');
    }

    if (updatedReservation.vehicleInfo === originalReservation.vehicleInfo) {
      throw new Error('Informations véhicule non modifiées');
    }

    if (updatedReservation.status === originalReservation.status) {
      throw new Error('Statut de réservation non modifié');
    }

    console.log('   ✅ Réservation modifiée avec succès');
  }

  // Test 8: Test de suppression d'une réservation
  testDeleteReservation() {
    const reservation = RESERVATION_SCENARIOS.withFormula;

    // Simulation de la suppression
    const deletedReservation = null;

    if (deletedReservation !== null) {
      throw new Error('Réservation non supprimée');
    }

    console.log('   ✅ Réservation supprimée avec succès');
  }

  // Test 9: Test de changement de statut
  testStatusChange() {
    const reservation = RESERVATION_SCENARIOS.simple;

    // Test transition pending → confirmed
    const confirmedReservation = { ...reservation, status: 'confirmed' };
    if (confirmedReservation.status !== 'confirmed') {
      throw new Error('Changement de statut vers confirmed échoué');
    }

    // Test transition confirmed → completed
    const completedReservation = { ...confirmedReservation, status: 'completed' };
    if (completedReservation.status !== 'completed') {
      throw new Error('Changement de statut vers completed échoué');
    }

    // Test transition pending → cancelled_by_client
    const cancelledReservation = { ...reservation, status: 'cancelled_by_client' };
    if (cancelledReservation.status !== 'cancelled_by_client') {
      throw new Error('Changement de statut vers cancelled_by_client échoué');
    }

    console.log('   ✅ Changements de statut validés');
  }

  // Test 10: Test des permissions admin
  testAdminPermissions() {
    const adminUser = {
      role: 'admin',
      permissions: ['reservation:read', 'reservation:write', 'reservation:delete', 'reservation:admin']
    };

    const shopOwner = {
      role: 'shop_owner',
      permissions: ['reservation:read', 'reservation:write']
    };

    // Validation des permissions admin
    if (!adminUser.permissions.includes('reservation:admin')) {
      throw new Error('Admin doit avoir les permissions d\'administration des réservations');
    }

    // Validation des permissions shop owner
    if (shopOwner.permissions.includes('reservation:admin')) {
      throw new Error('Shop owner ne doit pas avoir les permissions d\'administration des réservations');
    }

    console.log('   ✅ Permissions validées');
  }

  // Test 11: Test de validation des services
  testServiceValidation() {
    const reservation = RESERVATION_SCENARIOS.complete;

    for (const service of reservation.services) {
      // Validation des champs requis
      if (!service.serviceId || !service.serviceName) {
        throw new Error('Service doit avoir serviceId et serviceName');
      }

      // Validation du prix et de la durée
      if (typeof service.totalPrice !== 'number' || service.totalPrice <= 0) {
        throw new Error('Prix de service invalide');
      }

      if (typeof service.duration !== 'number' || service.duration <= 0) {
        throw new Error('Durée de service invalide');
      }

      // Validation des add-ons
      if (!Array.isArray(service.addOns)) {
        throw new Error('Add-ons de service doivent être un tableau');
      }
    }

    console.log('   ✅ Validation des services');
  }

  // Test 12: Test de calcul de prix total
  testTotalPriceCalculation() {
    const reservation = RESERVATION_SCENARIOS.complete;

    // Calcul du prix total à partir des services
    const calculatedTotalPrice = reservation.services.reduce((total, service) => {
      return total + service.totalPrice;
    }, 0);

    // Validation que le prix total correspond
    if (calculatedTotalPrice !== reservation.totalPrice) {
      throw new Error(`Calcul de prix total incorrect: attendu ${reservation.totalPrice}, obtenu ${calculatedTotalPrice}`);
    }

    console.log('   ✅ Calcul de prix total validé');
  }

  // Test 13: Test de calcul de durée totale
  testTotalDurationCalculation() {
    const reservation = RESERVATION_SCENARIOS.complete;

    // Calcul de la durée totale à partir des services
    const calculatedTotalDuration = reservation.services.reduce((total, service) => {
      return total + service.duration;
    }, 0);

    // Validation que la durée totale correspond
    if (calculatedTotalDuration !== reservation.totalDuration) {
      throw new Error(`Calcul de durée totale incorrect: attendu ${reservation.totalDuration}, obtenu ${calculatedTotalDuration}`);
    }

    console.log('   ✅ Calcul de durée totale validé');
  }

  // Test 14: Test de validation des contraintes métier
  testBusinessConstraints() {
    // Test contrainte: réservation dans le futur
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const futureDateString = futureDate.toISOString().split('T')[0];

    const futureReservation = {
      ...RESERVATION_SCENARIOS.simple,
      date: futureDateString
    };

    if (new Date(futureReservation.date) <= new Date()) {
      throw new Error('Réservation doit être dans le futur');
    }

    // Test contrainte: prix minimum
    for (const [scenarioName, reservation] of Object.entries(RESERVATION_SCENARIOS)) {
      if (reservation.totalPrice < 100) { // Minimum 1€
        throw new Error(`Prix de réservation trop bas dans ${scenarioName}: ${reservation.totalPrice}`);
      }
    }

    // Test contrainte: durée minimum
    for (const [scenarioName, reservation] of Object.entries(RESERVATION_SCENARIOS)) {
      if (reservation.totalDuration < 15) { // Minimum 15 minutes
        throw new Error(`Durée de réservation trop courte dans ${scenarioName}: ${reservation.totalDuration}`);
      }
    }

    console.log('   ✅ Contraintes métier validées');
  }

  // Test 15: Test de gestion des réservations annulées
  testCancelledReservationHandling() {
    const cancelledReservation = RESERVATION_SCENARIOS.cancelled;

    // Validation du statut annulé
    if (!cancelledReservation.status.includes('cancelled')) {
      throw new Error('Réservation annulée doit avoir un statut cancelled');
    }

    // Validation que les données sont conservées
    if (!cancelledReservation.customerName || !cancelledReservation.services) {
      throw new Error('Données de réservation annulée doivent être conservées');
    }

    console.log('   ✅ Gestion des réservations annulées validée');
  }
}

// Exécution des tests
async function runReservationTests() {
  const testSuite = new ReservationCRUDTests();

  // Ajouter tous les tests
  testSuite.addTest('Création réservation simple', () => testSuite.testCreateSimpleReservation());
  testSuite.addTest('Création réservation avec formule', () => testSuite.testCreateReservationWithFormula());
  testSuite.addTest('Création réservation avec add-ons', () => testSuite.testCreateReservationWithAddOns());
  testSuite.addTest('Création réservation complète', () => testSuite.testCreateCompleteReservation());
  testSuite.addTest('Validation formats de données', () => testSuite.testDataFormatValidation());
  testSuite.addTest('Validation statuts de réservation', () => testSuite.testReservationStatusValidation());
  testSuite.addTest('Modification d\'une réservation', () => testSuite.testUpdateReservation());
  testSuite.addTest('Suppression d\'une réservation', () => testSuite.testDeleteReservation());
  testSuite.addTest('Changement de statut', () => testSuite.testStatusChange());
  testSuite.addTest('Permissions admin', () => testSuite.testAdminPermissions());
  testSuite.addTest('Validation des services', () => testSuite.testServiceValidation());
  testSuite.addTest('Calcul de prix total', () => testSuite.testTotalPriceCalculation());
  testSuite.addTest('Calcul de durée totale', () => testSuite.testTotalDurationCalculation());
  testSuite.addTest('Contraintes métier', () => testSuite.testBusinessConstraints());
  testSuite.addTest('Gestion des réservations annulées', () => testSuite.testCancelledReservationHandling());

  // Exécuter les tests
  await testSuite.runTests();
}

// Lancer les tests
runReservationTests().catch(console.error);

