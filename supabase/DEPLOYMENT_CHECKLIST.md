# 🚀 Checklist de Déploiement - DetailDeck

## ✅ Scripts Créés et Prêts

### 1. **Reset Complet de la DB**
- **Fichier :** `complete_db_reset_and_demo_setup.sql`
- **Usage :** Supprime toutes les données et crée le compte démo complet
- **Compte démo :** `demo@account.com` / `demoaccount`

### 2. **Auto-seed pour Nouveaux Comptes**
- **Fichier :** `setup_auto_seed_trigger.sql`
- **Fonction :** `auto-seed-new-shop/index.ts`
- **Usage :** Ajoute automatiquement catégories et tailles de véhicules par défaut

### 3. **Vérifications Existantes**
- `check_rls_policies.sql` - Vérification sécurité RLS
- `simple_final_check.sql` - Vérification rapide
- `final_pre_live_checklist.sql` - Checklist complète

---

## 🎯 Ordre d'Exécution Recommandé

### Phase 1: Reset et Setup Initial
```sql
-- 1. Exécuter le reset complet (ATTENTION: supprime tout)
\i complete_db_reset_and_demo_setup.sql

-- 2. Créer le compte demo@account.com manuellement via Supabase Auth
-- Email: demo@account.com
-- Password: demoaccount
-- Confirmer l'email manuellement

-- 3. Relancer le script setup démo si nécessaire
```

### Phase 2: Configuration Auto-seed
```sql
-- 4. Installer le trigger auto-seed
\i setup_auto_seed_trigger.sql
```

### Phase 3: Vérifications
```sql
-- 5. Vérifier la sécurité RLS
\i check_rls_policies.sql

-- 6. Vérification finale
\i final_pre_live_checklist.sql
```

---

## 📋 Données du Compte Démo

### 🏪 **Shop: "DetailPro Démo"**
- **Type :** Mobile (se déplace chez les clients)
- **Ville :** Paris
- **Rayon :** 25km
- **Téléphone :** +33 1 23 45 67 89

### 🚗 **4 Tailles de Véhicules**
1. **Citadine** - Petites voitures urbaines
2. **Berline / Coupé** - Berlines, coupés, cabriolets
3. **Break / SUV Compact** - Breaks, SUV compacts
4. **4x4 / Minivan** - Gros 4x4, minivans, utilitaires

### 🛠️ **2 Catégories de Services**

#### **Intérieur**
- **Nettoyage Intérieur Complet** (89€, 120min)
  - Suppléments par taille: 0€, +15€, +25€, +40€
- **Détailing Intérieur Premium** (159€, 180min)
  - Suppléments par taille: 0€, +25€, +40€, +60€
  - Formule Luxe: +50€, +60min

#### **Extérieur**
- **Lavage Extérieur Complet** (45€, 90min)
  - Suppléments par taille: 0€, +10€, +20€, +35€
- **Polish & Cire Protection** (199€, 240min)
  - Suppléments par taille: 0€, +30€, +50€, +80€
  - Protection Céramique: +150€, +120min

### 🔧 **3 Add-ons Globaux**
- **Nettoyage Moteur** - 35€, 30min
- **Traitement Anti-Pluie** - 25€, 15min
- **Ozone / Désodorisation** - 45€, 45min

---

## 🌐 Traductions

### ✅ **Langues Supportées**
- **Français** (par défaut) - Auto-seed avec catégories FR
- **Anglais** - Auto-seed avec catégories EN
- **Espagnol** - Auto-seed avec catégories ES

### 🔄 **Auto-détection de Langue**
- Basée sur l'extension email (.fr, .com, .es)
- Par défaut: Français

---

## 🎮 Fonctionnalités Démo

### ✅ **Bouton "Accéder à la Démo"**
- **Emplacement :** Landing page (Header)
- **Fonction :** Connexion directe à `demo@account.com`
- **Traductions :** Disponibles en FR/EN/ES

### ✅ **Connexion Automatique**
- **Email :** `demo@account.com`
- **Password :** `demoaccount`
- **Mode Mock :** Supporté pour développement

---

## 🔐 Sécurité RLS

### ✅ **Tables Sécurisées**
- `shops` - Propriétaire uniquement
- `services` - Services du shop propriétaire
- `formulas` - Formules des services propriétaires
- `add_ons` - Add-ons du shop propriétaire
- `service_vehicle_size_supplements` - Suppléments propriétaires
- `shop_vehicle_sizes` - Tailles propriétaires
- `shop_service_categories` - Catégories propriétaires
- `reservations` - Réservations du shop propriétaire
- `leads` - Leads du shop propriétaire

---

## 🚨 Points d'Attention

### ⚠️ **Avant Production**
1. **Créer manuellement** le compte `demo@account.com` via Supabase Auth
2. **Confirmer l'email** manuellement
3. **Tester la connexion démo** depuis la landing page
4. **Vérifier les RLS policies** avec `check_rls_policies.sql`

### ⚠️ **Après Déploiement**
1. **Tester l'auto-seed** en créant un nouveau compte
2. **Vérifier les traductions** dans les 3 langues
3. **Tester le parcours client** complet sur le shop démo

---

## 📞 Support

Si des problèmes surviennent :
1. Vérifier les logs Supabase
2. Exécuter `simple_final_check.sql` pour diagnostiquer
3. Relancer `complete_db_reset_and_demo_setup.sql` si nécessaire

---

**✨ Tout est prêt pour le déploiement ! ✨**
