# 🚗 DetailDeck - SaaS de Réservation pour Détaillants Auto

<div align="center">
  <img src="https://img.shields.io/badge/Status-MVP%20Ready-brightgreen" alt="Status" />
  <img src="https://img.shields.io/badge/Tech-Next.js%20%7C%20Supabase%20%7C%20TypeScript-blue" alt="Tech Stack" />
  <img src="https://img.shields.io/badge/UI-Tailwind%20%7C%20shadcn/ui-purple" alt="UI" />
</div>

## 🎯 Vision du Projet

**DetailDeck** est une plateforme SaaS ultra-intuitive pour les détaillants automobiles. Les professionnels créent un shop, ajoutent des services, définissent leur disponibilité et obtiennent une URL publique de réservation. Les clients choisissent la taille du véhicule → catégorie → service(s)/formule(s)/add-ons → créneau → informations de contact.

### 🌟 Proposition de Valeur

- **Pour les Détaillants** : Gestion complète de leur activité avec catalogue modulaire
- **Pour les Clients** : Réservation intuitive avec prix transparent et personnalisable
- **Pour le Marché** : Solution clé en main pour digitaliser le secteur du detailing

---

## 🏗️ Architecture Technique

### Stack Technologique
- **Frontend** : Next.js 14 (App Router) + TypeScript
- **Backend** : Supabase (PostgreSQL + Auth + Storage)
- **UI/UX** : Tailwind CSS + shadcn/ui + Lucide Icons
- **Déploiement** : Vercel + Supabase Cloud
- **Validation** : Zod + React Hook Form

### Structure des Données
```
shops → vehicle_sizes → service_categories → services → formulas/add-ons
  ↓
reservations → reservation_services → reservation_addons
```

---

## 🎨 Features Principales

### 🏪 **Gestion des Shops**
Configuration complète du profil professionnel avec images, zones de service, horaires et paramètres de réservation.

### 🚗 **Gestion des Véhicules**
Système de catégorisation par taille avec modificateurs automatiques de prix/durée selon la complexité.

### 🛠️ **Catalogue de Services**
Système modulaire avec catégories, formules (packages) et add-ons optionnels. Calcul automatique des prix totaux.

### 📅 **Système de Réservation**
Moteur de créneaux intelligent respectant horaires, délais et réservations existantes avec calculs temps réel.

### 👤 **Interface Client Public**
Parcours de réservation optimisé et responsive : Véhicule → Services → Créneau → Confirmation.

> 📖 **Documentation complète** : Voir [FEATURES_AND_TESTING.md](./FEATURES_AND_TESTING.md) pour toutes les user stories et tests détaillés.

---

## 🚀 Installation et Démarrage

### Prérequis
- **Node.js** 18+
- **npm** ou **yarn**
- **Compte Supabase** (gratuit)
- **Git** pour le versioning

### Environnements

#### 🔧 **Développement Local**
```bash
# Cloner le repository
git clone https://github.com/[username]/DetailDeck.git
cd DetailDeck

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Remplir avec vos clés Supabase

# Seeder la base de données (optionnel)
node seed-final.js

# Démarrer en développement
npm run dev
# 🌐 Application disponible sur http://localhost:5173
```

#### ☁️ **Staging/Production**
```bash
# Build pour production
npm run build

# Prévisualiser le build
npm run preview

# Déployer sur Vercel (recommandé)
vercel --prod
```

### Configuration Supabase

<details>
<summary><strong>📋 Guide de Configuration Détaillé</strong></summary>

#### 1. **Créer le Projet**
- Aller sur [supabase.com](https://supabase.com)
- Créer un nouveau projet
- Noter l'URL et les clés API

#### 2. **Variables d'Environnement**
Créer `.env.local` avec :
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### 3. **Base de Données**
```bash
# Exécuter les migrations
supabase db push

# Ou manuellement via l'interface Supabase
# Copier le contenu des fichiers dans /supabase/migrations/
```

#### 4. **Politiques RLS**
- Configurer Row Level Security via l'interface Supabase
- Utiliser les scripts dans `/supabase/` pour l'auto-configuration

#### 5. **Storage (Images)**
- Créer les buckets pour les images
- Configurer les politiques d'accès public

</details>

### Scripts Disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | 🔧 Serveur de développement (localhost:5173) |
| `npm run build` | 📦 Build pour production |
| `npm run preview` | 👀 Prévisualiser le build |
| `npm run lint` | 🔍 Vérifier le code (ESLint) |
| `npm run test` | 🧪 Lancer les tests |
| `node seed-final.js` | 🌱 Seeder la base de données |

---

## 🧪 Tests et Validation

### Scénarios de Test Principaux

#### 🏆 **Scénario Gold : Réservation Complète**
```
Client → Sélection véhicule → Choix services → Créneau → Confirmation → Dashboard pro
```

#### 🔧 **Tests Techniques Critiques**
- **Calculs de Prix** : Base + Formule + Taille + Add-ons = Total exact
- **Calculs de Durée** : Somme précise pour génération des créneaux
- **Moteur de Créneaux** : Respect de toutes les contraintes temporelles

#### 📱 **Tests UX/UI**
- Responsive design sur tous devices
- Navigation intuitive et performance < 3s
- Gestion d'erreurs gracieuse

### ✅ Critères de Validation

**Le système est prêt si :**
- [ ] ✅ Tous les calculs sont mathématiquement exacts
- [ ] ✅ Les créneaux respectent toutes les contraintes
- [ ] ✅ L'interface est intuitive pour tous les utilisateurs
- [ ] ✅ Cohérence parfaite dashboard ↔ interface publique

---

## 📈 Roadmap

### ✅ **MVP (Actuel)**
- Gestion complète des shops et services
- Système de réservation fonctionnel
- Interface client responsive
- Dashboard professionnel

### 🔄 **V2 (Prochaine)**
- 💳 Paiements en ligne (Stripe)
- 👥 Gestion multi-staff
- 📊 Analytics avancées
- 🔄 Réservations récurrentes

### 🚀 **V3 (Future)**
- 🤖 IA pour chate avec les leads
- 🌍 Multi-localisation
- 📈 Marketplace de détaillants

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez notre guide de contribution pour plus de détails.

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

<div align="center">
  <p>Fait avec ❤️ pour révolutionner le secteur du detailing automobile</p>
  <p>
    <a href="#-installation-et-démarrage">🚀 Démarrer</a> •
    <a href="./FEATURES_AND_TESTING.md">📖 Features & Tests</a> •
    <a href="mailto:contact@detaildeck.com">📧 Contact</a>
  </p>
</div>
