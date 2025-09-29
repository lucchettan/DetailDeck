# 🎨 Features & User Stories - DetailDeck

## 🏪 **Feature 1 : Gestion des Shops**
*Configuration complète du profil professionnel*

**Fonctionnalités :**
- Profil avec images, description, coordonnées
- Gestion des zones de service (ville + rayon km)
- Configuration des horaires d'ouverture par jour
- Paramètres de réservation (délai min, avance max)

### 📋 User Stories - Gestion des Shops

<details>
<summary><strong>👨‍💼 US1.1 : Configuration Initiale</strong></summary>

```
En tant que détailleur,
Je veux configurer mon shop avec toutes mes informations,
Pour que les clients puissent me trouver et comprendre mon offre.
```

**Tests à valider :**
- [ ] ✅ **Créer un shop complet**
  - Nom, description, photos (1-4)
  - Adresse physique OU zones de service
  - Téléphone, email de contact
- [ ] ✅ **Configurer les horaires**
  - Horaires par jour de semaine
  - Gestion des jours fermés
- [ ] ✅ **Paramètres avancés**
  - Délai minimum de réservation
  - Avance maximum autorisée
- [ ] ✅ **Prévisualisation** de la page publique

</details>

<details>
<summary><strong>👨‍💼 US1.2 : Modification du Profil</strong></summary>

```
En tant que détailleur,
Je veux modifier les informations de mon shop,
Pour tenir mes clients informés des changements.
```

**Tests à valider :**
- [ ] ✅ **Modifier les informations** générales
- [ ] ✅ **Changer les photos** du shop
- [ ] ✅ **Ajuster les horaires** saisonniers
- [ ] ✅ **Sauvegarder** et voir les changements persistants

</details>

---

## 🚗 **Feature 2 : Gestion des Véhicules**
*Système de catégorisation par taille avec modificateurs de prix*

**Fonctionnalités :**
- Création de tailles personnalisées (Citadine, SUV, etc.)
- Images et descriptions pour chaque taille
- Modificateurs de prix/durée automatiques par service

### 📋 User Stories - Gestion des Véhicules

<details>
<summary><strong>👨‍💼 US2.1 : Définition des Tailles</strong></summary>

```
En tant que détailleur,
Je veux définir les tailles de véhicules que je traite,
Pour adapter mes prix selon la complexité du travail.
```

**Tests à valider :**
- [ ] ✅ **Créer des tailles** (Citadine, Berline, SUV, Utilitaire)
- [ ] ✅ **Ajouter des descriptions** claires
- [ ] ✅ **Uploader des images** représentatives
- [ ] ✅ **Réorganiser l'ordre** d'affichage

</details>

<details>
<summary><strong>👨‍💼 US2.2 : Modificateurs de Prix</strong></summary>

```
En tant que détailleur,
Je veux que mes prix s'adaptent automatiquement à la taille,
Pour facturer justement selon l'effort requis.
```

**Tests à valider :**
- [ ] ✅ **Configurer les modificateurs** par service
- [ ] ✅ **Tester les calculs** automatiques
- [ ] ✅ **Vérifier la cohérence** prix/durée
- [ ] ✅ **Modifier/supprimer** des tailles existantes

</details>

---

## 🛠️ **Feature 3 : Catalogue de Services**
*Système modulaire avec catégories, formules et add-ons*

**Fonctionnalités :**
- Catégories de services (Intérieur, Extérieur, etc.)
- Services avec prix/durée de base et images
- Formules (packages) avec prix additifs
- Add-ons optionnels par service
- Calcul automatique des prix totaux

### 📋 User Stories - Catalogue de Services

#### 👨‍💼 **US3.1 : Organisation par Catégories**
```
En tant que détailleur,
Je veux organiser mes services en catégories,
Pour faciliter la navigation de mes clients.
```

**Tests à valider :**
- [ ] ✅ **Créer des catégories** (Intérieur, Extérieur, Complémentaire)
- [ ] ✅ **Ajouter des images** de catégorie
- [ ] ✅ **Réorganiser l'ordre** d'affichage
- [ ] ✅ **Modifier/supprimer** des catégories

#### 👨‍💼 **US3.2 : Création de Services**
```
En tant que détailleur,
Je veux créer des services détaillés avec photos,
Pour présenter professionnellement mon offre.
```

**Tests à valider :**
- [ ] ✅ **Créer un service de base**
  - Nom, description complète
  - Prix et durée de base
  - Images (1-4 photos)
  - Catégorie associée
- [ ] ✅ **Configurer les options**
  - État actif/inactif
  - Ordre d'affichage
- [ ] ✅ **Prévisualiser** côté client

#### 👨‍💼 **US3.3 : Système de Formules**
```
En tant que détailleur,
Je veux proposer différentes formules (Basique/Confort/Premium),
Pour offrir des options adaptées à tous les budgets.
```

**Tests à valider :**
- [ ] ✅ **Créer des formules** pour un service
  - "Basique" (+0€, +0min)
  - "Confort" (+20€, +15min)
  - "Premium" (+40€, +30min)
- [ ] ✅ **Définir les inclusions** (checklist features)
- [ ] ✅ **Tester les calculs** prix/durée
- [ ] ✅ **Modifier/supprimer** des formules

#### 👨‍💼 **US3.4 : Add-ons Optionnels**
```
En tant que détailleur,
Je veux proposer des extras optionnels,
Pour maximiser la valeur de chaque réservation.
```

**Tests à valider :**
- [ ] ✅ **Créer des add-ons** par service
  - "Traitement cuir" (+25€, +20min)
  - "Dégoudronnage" (+15€, +10min)
  - "Cire céramique" (+50€, +30min)
- [ ] ✅ **Configurer disponibilité** par service
- [ ] ✅ **Tester cumul** prix/durée
- [ ] ✅ **Gérer l'ordre** d'affichage

---

## 📅 **Feature 4 : Système de Réservation**
*Moteur de créneaux avec calculs automatiques et contraintes*

**Fonctionnalités :**
- Génération automatique des créneaux disponibles
- Respect des horaires, délais et réservations existantes
- Calcul temps réel des prix selon sélections
- Gestion des statuts (pending → confirmed → completed)

### 📋 User Stories - Système de Réservation

#### 👨‍💼 **US4.1 : Gestion du Planning**
```
En tant que détailleur,
Je veux voir et gérer toutes mes réservations,
Pour organiser efficacement mon planning.
```

**Tests à valider :**
- [ ] ✅ **Voir toutes les réservations** (liste + détails)
- [ ] ✅ **Filtrer par statut** et période
- [ ] ✅ **Créer une réservation** manuellement
- [ ] ✅ **Modifier une réservation** existante
- [ ] ✅ **Changer les statuts** (workflow complet)

#### 👨‍💼 **US4.2 : Validation des Créneaux**
```
En tant que détailleur,
Je veux que le système respecte mes contraintes,
Pour éviter les conflits de planning.
```

**Tests à valider :**
- [ ] ✅ **Horaires d'ouverture** respectés
- [ ] ✅ **Délai minimum** appliqué
- [ ] ✅ **Avance maximum** respectée
- [ ] ✅ **Créneaux occupés** bloqués
- [ ] ✅ **Durée totale** prise en compte

---

## 👤 **Feature 5 : Interface Client Public**
*Parcours de réservation optimisé et responsive*

**Fonctionnalités :**
- Page publique du shop avec URL personnalisée
- Parcours guidé : Véhicule → Services → Créneau → Confirmation
- Calculs temps réel et panier persistant
- Interface mobile-first avec UX optimisée

### 📋 User Stories - Interface Client

#### 👤 **US5.1 : Découverte du Shop**
```
En tant que client,
Je veux découvrir un détaillant et ses services,
Pour évaluer si son offre correspond à mes besoins.
```

**Tests à valider :**
- [ ] ✅ **Accéder via URL** personnalisée (/{shopSlug})
- [ ] ✅ **Voir le profil** complet du détailleur
- [ ] ✅ **Explorer les services** avec photos
- [ ] ✅ **Comprendre la localisation** et horaires
- [ ] ✅ **Navigation responsive** (tous devices)

#### 👤 **US5.2 : Sélection du Véhicule**
```
En tant que client,
Je veux indiquer mon type de véhicule,
Pour avoir des prix adaptés à ma situation.
```

**Tests à valider :**
- [ ] ✅ **Voir toutes les tailles** disponibles
- [ ] ✅ **Comprendre les catégories** (avec images)
- [ ] ✅ **Sélectionner ma taille**
- [ ] ✅ **Modifier ma sélection** facilement

#### 👤 **US5.3 : Composition du Panier**
```
En tant que client,
Je veux composer mon package personnalisé,
Pour avoir exactement les services dont j'ai besoin.
```

**Tests à valider :**
- [ ] ✅ **Parcourir les catégories** de services
- [ ] ✅ **Voir les détails** (photos, descriptions)
- [ ] ✅ **Choisir des formules** (Basique/Premium)
- [ ] ✅ **Ajouter des add-ons** optionnels
- [ ] ✅ **Voir le prix** calculé en temps réel
- [ ] ✅ **Sélectionner plusieurs services**
- [ ] ✅ **Modifier mes choix** à tout moment

#### 👤 **US5.4 : Réservation de Créneau**
```
En tant que client,
Je veux choisir facilement une date et heure,
Pour planifier mon rendez-vous selon mes disponibilités.
```

**Tests à valider :**
- [ ] ✅ **Voir le calendrier** avec disponibilités
- [ ] ✅ **Sélectionner une date** future
- [ ] ✅ **Choisir un créneau** horaire libre
- [ ] ✅ **Voir la durée estimée** de l'intervention
- [ ] ✅ **Confirmer le créneau** choisi

#### 👤 **US5.5 : Finalisation**
```
En tant que client,
Je veux finaliser ma réservation simplement,
Pour sécuriser mon rendez-vous rapidement.
```

**Tests à valider :**
- [ ] ✅ **Remplir mes coordonnées** (validation claire)
- [ ] ✅ **Renseigner mon véhicule** (optionnel)
- [ ] ✅ **Ajouter des notes** spéciales
- [ ] ✅ **Voir le récapitulatif** complet
- [ ] ✅ **Confirmer la réservation**
- [ ] ✅ **Recevoir une confirmation** claire

---

# 🧪 Scénarios de Test Complets

## 🏆 **Scénario Gold : Réservation Complète**
*Test end-to-end du parcours client optimal*

```
1. 🌐 Client découvre le shop via URL publique
2. 🚗 Sélectionne "SUV" comme taille de véhicule
3. 🛠️ Choisit catégorie "Extérieur"
4. ✨ Sélectionne "Lavage Complet" + Formule "Premium" + Add-on "Dégoudronnage"
5. 📅 Choisit date dans 3 jours, créneau 14h00
6. 👤 Remplit ses informations complètes
7. ✅ Confirme la réservation
8. 👨‍💼 Détailleur voit la réservation dans son dashboard
9. ✅ Détailleur confirme la réservation (pending → confirmed)
```

**Critères de succès :**
- [ ] ✅ Parcours fluide sans friction
- [ ] ✅ Prix calculé exactement : Base + Premium + SUV + Dégoudronnage
- [ ] ✅ Durée calculée correctement pour le créneau
- [ ] ✅ Réservation visible instantanément côté pro
- [ ] ✅ Toutes les données sauvegardées correctement

## 🔄 **Scénario Modification : Gestion Flexible**
*Test de la capacité d'adaptation du système*

```
1. 👨‍💼 Détailleur modifie une réservation existante
2. 🔄 Change les services sélectionnés
3. 💰 Prix se recalcule automatiquement
4. 💾 Sauvegarde les changements
5. ✅ Vérification cohérence côté client
```

## 🏪 **Scénario Setup : Configuration Complète**
*Test de la mise en place d'un nouveau shop*

```
1. 👨‍💼 Détailleur configure son shop complet
2. 🚗 Crée 4 tailles de véhicules avec images
3. 🛠️ Crée 2 catégories de services
4. ✨ Crée 3 services avec formules et add-ons
5. ⏰ Configure horaires et zones de service
6. 🌐 Teste la page publique générée
```

---

# 🔧 Tests Techniques Critiques

## 💰 **Calculs de Prix**
**Scénario :** Service SUV avec formule Premium et 2 add-ons

- [ ] ✅ **Service de base** : Prix affiché correctement
- [ ] ✅ **+ Formule Premium** : +40€ ajoutés précisément
- [ ] ✅ **+ Modificateur SUV** : +15€ ajoutés automatiquement
- [ ] ✅ **+ 2 Add-ons** : +40€ ajoutés (20€ + 20€)
- [ ] ✅ **Total final** : Somme exacte de tous les composants
- [ ] ✅ **Cohérence** : Même calcul côté client et dashboard

## ⏱️ **Calculs de Durée**
**Scénario :** Service complexe avec tous les modificateurs

- [ ] ✅ **Durée de base** : Selon le service sélectionné
- [ ] ✅ **+ Durée formule** : Minutes ajoutées correctement
- [ ] ✅ **+ Durée modificateur** : Selon la taille du véhicule
- [ ] ✅ **+ Durée add-ons** : Cumul de tous les extras
- [ ] ✅ **Durée totale** : Somme précise de tous les éléments
- [ ] ✅ **Créneaux proposés** : Respectent exactement la durée calculée

## 📅 **Moteur de Créneaux**
**Scénario :** Validation de toutes les contraintes temporelles

- [ ] ✅ **Horaires d'ouverture** : Seules les heures d'ouverture proposées
- [ ] ✅ **Délai minimum** : Pas de créneaux avant le délai configuré
- [ ] ✅ **Avance maximum** : Pas de créneaux au-delà de la limite
- [ ] ✅ **Créneaux occupés** : Réservations existantes bloquent correctement
- [ ] ✅ **Durée respectée** : Créneau suffisamment long pour l'intervention complète

---

# 🚨 Tests de Robustesse

## ❌ **Gestion d'Erreurs**
- [ ] ✅ **Champs requis manquants** : Messages d'erreur explicites
- [ ] ✅ **Données invalides** : Validation côté client robuste
- [ ] ✅ **Connexion perdue** : Gestion gracieuse et récupération
- [ ] ✅ **Ressources inexistantes** : Redirections appropriées
- [ ] ✅ **Conflits de données** : Résolution automatique ou manuelle

## 🔄 **Intégrité des Données**
- [ ] ✅ **Modification de services** : Réservations existantes préservées
- [ ] ✅ **Suppression d'éléments** : Dépendances gérées proprement
- [ ] ✅ **Changements d'horaires** : Réservations existantes respectées
- [ ] ✅ **Synchronisation** : Cohérence temps réel dashboard ↔ public

---

# 📱 Tests UX/UI

## 🎨 **Interface Utilisateur**
- [ ] ✅ **Responsive design** : Parfait sur mobile/tablet/desktop
- [ ] ✅ **Navigation intuitive** : Retour en arrière fluide
- [ ] ✅ **États de chargement** : Indicateurs visuels appropriés
- [ ] ✅ **Feedback utilisateur** : Messages de succès/erreur visibles
- [ ] ✅ **Gestion des images** : Chargement et affichage optimaux

## ⚡ **Performance**
- [ ] ✅ **Temps de chargement** : < 3 secondes sur toutes les pages
- [ ] ✅ **Sauvegarde rapide** : Modifications persistées < 2 secondes
- [ ] ✅ **Calculs temps réel** : Prix mis à jour instantanément
- [ ] ✅ **Navigation fluide** : Transitions sans lag

---

# ✅ Critères de Validation Finale

## 🎯 **Fonctionnalités Core**
- [ ] ✅ Tous les calculs de prix sont **mathématiquement exacts**
- [ ] ✅ Les créneaux respectent **toutes les contraintes temporelles**
- [ ] ✅ La sauvegarde fonctionne **dans 100% des cas**
- [ ] ✅ L'interface est **intuitive pour tous les utilisateurs**

## 📊 **Intégrité Système**
- [ ] ✅ **Cohérence parfaite** entre dashboard et interface publique
- [ ] ✅ **Validation robuste** de toutes les données
- [ ] ✅ **Gestion d'erreurs** gracieuse et informative
- [ ] ✅ **Performance acceptable** sur tous les devices

## 🎨 **Expérience Utilisateur**
- [ ] ✅ **Design mobile-first** optimal
- [ ] ✅ **Navigation sans friction** pour tous les parcours
- [ ] ✅ **Messages clairs** et contextuels
- [ ] ✅ **Feedback temps réel** sur toutes les interactions
