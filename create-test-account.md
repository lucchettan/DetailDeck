# Création du compte de test Nomad Lab

## Instructions pour créer manuellement le compte de test

### 1. Créer le compte utilisateur
1. Aller sur http://localhost:5174
2. Cliquer sur "Se connecter" 
3. Cliquer sur "Créer un compte"
4. Utiliser les informations suivantes :
   - **Email** : `hello@nomad-lab.io`
   - **Mot de passe** : `nomadlab123`

### 2. Compléter l'onboarding
1. **Informations du shop** :
   - Nom : `Nomad Lab Auto Care`
   - Adresse : `15 Rue de la Paix, Paris`
   - Téléphone : `01 23 45 67 89`
   - Type : `Local` (boutique physique)

2. **Horaires d'ouverture** :
   - Lundi-Vendredi : 9h00-18h00
   - Samedi : 9h00-17h00
   - Dimanche : Fermé

3. **Catégories de services** :
   - `Nettoyage Intérieur` (avec image)
   - `Nettoyage Extérieur` (avec image)  
   - `Prestations Premium` (avec image)

4. **Tailles de véhicules** :
   - `Citadine/Compacte`
   - `Berline/SUV moyen`
   - `SUV/4x4 grand format`

5. **Services** (utiliser le formulaire complet) :

   **Nettoyage Intérieur Complet** (45€, 90min)
   - Images : 2 photos de nettoyage intérieur
   - Variations par taille :
     - Citadine : +0€, +0min
     - Berline : +10€, +15min
     - SUV : +20€, +30min
   - Formules :
     - Confort (+15€, +20min) : Shampoing tapis, plastiques satinés, traitement cuir, désodorisation
     - Premium (+30€, +40min) : Tout Confort + climatisation + protection tissus + jantes intérieures
   - Add-ons :
     - Désodorisation Ozone (+20€, +30min)
     - Nettoyage Climatisation (+15€, +20min)

   **Nettoyage Sièges Spécialisé** (25€, 45min)
   - Images : 1 photo de sièges
   - Variations par taille :
     - Citadine : +0€, +0min
     - Berline : +5€, +10min
     - SUV : +10€, +20min
   - Formules :
     - Formule Cuir Premium (+10€, +15min) : Nettoyage cuir spécialisé, conditioning, protection UV

   **Lavage Extérieur Écologique** (35€, 60min)
   - Images : 2 photos de lavage extérieur
   - Variations par taille :
     - Citadine : +0€, +0min
     - Berline : +10€, +15min
     - SUV : +20€, +30min
   - Formules :
     - Formule Brillance Naturelle (+20€, +25min) : Cire liquide écologique, décontamination jantes, traitement pneumatiques, séchage sans traces
   - Add-ons :
     - Cire Carnauba Naturelle (+25€, +25min)
     - Nettoyage Moteur Écologique (+30€, +35min)

   **Décontamination Ferreuse** (40€, 75min)
   - Images : 1 photo de décontamination
   - Variations par taille :
     - Citadine : +0€, +0min
     - Berline : +15€, +20min
     - SUV : +30€, +40min

   **Traitement Céramique Écologique** (150€, 180min)
   - Images : 2 photos de traitement céramique
   - Variations par taille :
     - Citadine : +0€, +0min
     - Berline : +50€, +30min
     - SUV : +100€, +60min
   - Formules :
     - Céramique 6 mois (inclus) : Protection 6 mois, facilité entretien, éclat renforcé, produits écologiques
     - Céramique 12 mois Premium (+50€, +60min) : Protection 12 mois, facilité maximale, éclat exceptionnel, garantie étendue, produits premium
   - Add-ons :
     - Correction Peinture (+80€, +120min)

### 3. Tester le booking flow
1. Aller sur http://localhost:5174/nomad-lab-auto-care
2. Tester la sélection de services avec différentes tailles de véhicules
3. Vérifier que les prix et durées se calculent correctement
4. Tester le processus de réservation complet

### 4. Tester le dashboard
1. Aller sur http://localhost:5174/dashboard
2. Vérifier que tous les services, catégories et tailles sont visibles
3. Tester l'édition des services
4. Vérifier les réservations

## URLs de test
- **Page publique** : http://localhost:5174/nomad-lab-auto-care
- **Dashboard** : http://localhost:5174/dashboard
- **Connexion** : hello@nomad-lab.io / nomadlab123
