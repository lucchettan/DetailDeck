# 🧪 Guide de Tests Manuels - Système Complet

## 🎯 Objectif
Valider que tout le système fonctionne parfaitement avant de passer au BookingFlow.

---

## 📋 Tests Dashboard Pro (Côté Propriétaire)

### 1. Gestion des Shops
**URL**: `/dashboard` → Settings

#### ✅ Test 1.1: Création/Modification Shop
- [ ] **Créer un shop** avec toutes les informations
  - Nom, description, adresse
  - Images (1-4 photos)
  - Horaires d'ouverture
  - Zones de service
  - Paramètres avancés (min notice, advance weeks)
- [ ] **Modifier le shop** existant
  - Changer le nom, description
  - Ajouter/supprimer des images
  - Modifier les horaires
- [ ] **Vérifier la sauvegarde** - Les changements persistent après refresh

#### ✅ Test 1.2: Gestion des Catégories
- [ ] **Créer une catégorie** (ex: "Nettoyage Intérieur")
  - Nom, image optionnelle
  - Ordre d'affichage
- [ ] **Modifier une catégorie** existante
- [ ] **Supprimer une catégorie** (vérifier que les services ne sont pas cassés)
- [ ] **Réorganiser l'ordre** des catégories

#### ✅ Test 1.3: Gestion des Tailles de Véhicules
- [ ] **Créer des tailles** (ex: "Citadine", "Berline", "SUV")
  - Nom, description, image optionnelle
  - Ordre d'affichage
- [ ] **Modifier une taille** existante
- [ ] **Supprimer une taille** (vérifier les services liés)
- [ ] **Réorganiser l'ordre** des tailles

### 2. Gestion des Services
**URL**: `/dashboard` → Catalog → Services

#### ✅ Test 2.1: Création de Service
- [ ] **Créer un service complet**
  - Nom, description, prix de base, durée
  - Images (1-4 photos)
  - Catégorie associée
  - **Formules** (ex: "Basique", "Premium", "Luxe")
    - Prix et durée supplémentaires
    - Liste des inclusions
  - **Modificateurs par taille** de véhicule
    - Prix/durée supplémentaires par taille
  - **Add-ons** (ex: "Traitement cuir", "Dégoudronnage")
    - Prix et durée supplémentaires

#### ✅ Test 2.2: Modification de Service
- [ ] **Modifier un service** existant
  - Changer le prix, la durée
  - Ajouter/supprimer des formules
  - Modifier les modificateurs par taille
  - Ajouter/supprimer des add-ons
- [ ] **Vérifier la sauvegarde** - Tous les changements persistent

#### ✅ Test 2.3: Gestion des Formules
- [ ] **Créer plusieurs formules** pour un service
  - "Basique" (+0€, +0min)
  - "Confort" (+20€, +15min)
  - "Premium" (+40€, +30min)
- [ ] **Modifier une formule** existante
- [ ] **Supprimer une formule** (vérifier les réservations existantes)

#### ✅ Test 2.4: Gestion des Add-ons
- [ ] **Créer des add-ons** pour un service
  - "Traitement cuir" (+25€, +20min)
  - "Dégoudronnage" (+15€, +10min)
- [ ] **Modifier un add-on** existant
- [ ] **Supprimer un add-on** (vérifier les réservations existantes)

### 3. Gestion des Réservations
**URL**: `/dashboard` → Reservations

#### ✅ Test 3.1: Création de Réservation
- [ ] **Créer une réservation complète**
  - Informations client (nom, email, téléphone)
  - Informations véhicule (marque, modèle, plaque)
  - Sélection de services avec formules et add-ons
  - Date et heure
  - Vérifier le calcul automatique du prix total
- [ ] **Créer une réservation minimale**
  - Seulement nom client et email
  - Date et heure
  - Vérifier que les champs optionnels sont bien optionnels

#### ✅ Test 3.2: Modification de Réservation
- [ ] **Modifier une réservation** existante
  - Changer les informations client
  - Modifier les services sélectionnés
  - Changer la date/heure
  - Vérifier la mise à jour du prix
- [ ] **Vérifier la sauvegarde** - Tous les changements persistent

#### ✅ Test 3.3: Gestion des Statuts
- [ ] **Changer le statut** d'une réservation
  - `upcoming` → `completed`
  - `upcoming` → `cancelled`
  - `completed` → `cancelled`
- [ ] **Vérifier l'affichage** des statuts dans la liste

#### ✅ Test 3.4: Suppression de Réservation
- [ ] **Supprimer une réservation** existante
- [ ] **Vérifier la suppression** - La réservation n'apparaît plus dans la liste

---

## 🌐 Tests Interface Client (Côté Public)

### 4. Page Publique du Shop
**URL**: `/{shopSlug}` (ex: `/mon-shop-detailing`)

#### ✅ Test 4.1: Affichage du Shop
- [ ] **Vérifier l'affichage** des informations du shop
  - Nom, description, images
  - Adresse et zones de service
  - Horaires d'ouverture
- [ ] **Vérifier l'affichage** des catégories et services
  - Toutes les catégories sont visibles
  - Tous les services actifs sont visibles
  - Les prix et durées sont corrects

#### ✅ Test 4.2: Sélection de Services
- [ ] **Sélectionner une taille** de véhicule
- [ ] **Choisir une catégorie** de service
- [ ] **Sélectionner un service** avec formule
  - Vérifier l'affichage des formules disponibles
  - Vérifier le calcul du prix avec la formule
- [ ] **Ajouter des add-ons**
  - Vérifier l'affichage des add-ons disponibles
  - Vérifier le calcul du prix avec les add-ons
- [ ] **Sélectionner plusieurs services**
  - Vérifier le calcul du prix total
  - Vérifier le calcul de la durée totale

#### ✅ Test 4.3: Sélection de Créneaux
- [ ] **Choisir une date** disponible
- [ ] **Sélectionner un créneau** horaire
  - Vérifier que seuls les créneaux disponibles sont proposés
  - Vérifier que la durée correspond à la durée totale des services
- [ ] **Vérifier les contraintes** (min notice, advance weeks)

#### ✅ Test 4.4: Informations Client
- [ ] **Remplir les informations** client
  - Nom, prénom, email, téléphone
  - Informations véhicule (optionnel)
  - Notes spéciales (optionnel)
- [ ] **Vérifier la validation** des champs requis

#### ✅ Test 4.5: Confirmation de Réservation
- [ ] **Vérifier le récapitulatif** de la réservation
  - Services sélectionnés avec formules et add-ons
  - Prix total correct
  - Date et heure
  - Informations client
- [ ] **Confirmer la réservation**
- [ ] **Vérifier la création** dans le dashboard pro

---

## 🔄 Tests de Cohérence et Intégration

### 5. Tests de Cohérence des Données

#### ✅ Test 5.1: Calculs de Prix
- [ ] **Vérifier les calculs** de prix dans différents scénarios
  - Service de base + formule + add-ons
  - Service avec modificateur par taille de véhicule
  - Plusieurs services avec différentes formules
- [ ] **Comparer les prix** entre l'interface client et le dashboard pro

#### ✅ Test 5.2: Calculs de Durée
- [ ] **Vérifier les calculs** de durée
  - Durée de base + formule + add-ons
  - Durée avec modificateur par taille
  - Durée totale pour plusieurs services
- [ ] **Vérifier la cohérence** entre durée calculée et créneaux proposés

#### ✅ Test 5.3: Gestion des Créneaux
- [ ] **Vérifier la disponibilité** des créneaux
  - Créneaux respectent les horaires d'ouverture
  - Créneaux respectent le min notice
  - Créneaux respectent l'advance weeks
  - Créneaux occupés ne sont pas proposés

### 6. Tests de Performance et UX

#### ✅ Test 6.1: Performance
- [ ] **Temps de chargement** des pages
  - Dashboard pro
  - Page publique du shop
  - Liste des réservations
- [ ] **Temps de sauvegarde** des modifications
  - Services, réservations, paramètres

#### ✅ Test 6.2: Expérience Utilisateur
- [ ] **Navigation fluide** entre les sections
- [ ] **Messages d'erreur** clairs et utiles
- [ ] **Confirmations** pour les actions importantes
- [ ] **Sauvegarde automatique** des formulaires

---

## 🚨 Tests de Gestion d'Erreurs

### 7. Tests de Robustesse

#### ✅ Test 7.1: Données Manquantes
- [ ] **Tenter de créer** une réservation sans nom client
- [ ] **Tenter de créer** un service sans prix
- [ ] **Tenter de modifier** avec des données invalides
- [ ] **Vérifier les messages** d'erreur appropriés

#### ✅ Test 7.2: Conflits de Données
- [ ] **Créer deux réservations** au même créneau
- [ ] **Modifier un service** utilisé dans des réservations
- [ ] **Supprimer une catégorie** avec des services
- [ ] **Vérifier la gestion** des conflits

#### ✅ Test 7.3: Données Corrompues
- [ ] **Tenter d'accéder** à une réservation inexistante
- [ ] **Tenter de modifier** un service supprimé
- [ ] **Vérifier la récupération** gracieuse des erreurs

---

## 📊 Checklist de Validation Finale

### ✅ Fonctionnalités Core
- [ ] **Création/Modification/Suppression** de tous les éléments
- [ ] **Calculs de prix** corrects dans tous les scénarios
- [ ] **Gestion des créneaux** respecte toutes les contraintes
- [ ] **Sauvegarde** de toutes les modifications
- [ ] **Affichage** correct de toutes les données

### ✅ Interface Utilisateur
- [ ] **Navigation** intuitive et fluide
- [ ] **Messages d'erreur** clairs et utiles
- [ ] **Confirmations** pour les actions importantes
- [ ] **Responsive design** sur mobile et desktop

### ✅ Intégrité des Données
- [ ] **Cohérence** entre interface client et dashboard pro
- [ ] **Validation** des données côté client et serveur
- [ ] **Gestion des erreurs** robuste
- [ ] **Performance** acceptable

---

## 🎯 Critères de Réussite

**Le système est prêt si :**
- ✅ Tous les tests ci-dessus passent
- ✅ Aucune erreur critique n'est rencontrée
- ✅ Les calculs de prix/durée sont toujours corrects
- ✅ La sauvegarde fonctionne dans tous les cas
- ✅ L'interface est fluide et intuitive

**En cas d'échec :**
- 🔍 Identifier le problème spécifique
- 📝 Noter les étapes pour reproduire l'erreur
- 🛠️ Corriger le problème avant de continuer
- 🔄 Re-tester la fonctionnalité corrigée

---

## 📝 Notes de Test

**Date de test**: ___________
**Testeur**: ___________
**Version**: ___________

**Problèmes rencontrés**:
- [ ] Problème 1: ___________
- [ ] Problème 2: ___________
- [ ] Problème 3: ___________

**Actions correctives**:
- [ ] Action 1: ___________
- [ ] Action 2: ___________
- [ ] Action 3: ___________

**Validation finale**: ✅ Système prêt / ❌ Corrections nécessaires

