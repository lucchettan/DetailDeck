# 🚀 Workflow de Développement - Resaone

## 📋 **BASES DE DONNÉES**

### 🔴 **PRODUCTION** (NE PAS TOUCHER)
- **Nom**: DetailDeck
- **ID**: `jtusofarsnwcfxnrvgus`
- **URL**: https://jtusofarsnwcfxnrvgus.supabase.co
- **Usage**: Site en production uniquement

### 🟢 **DÉVELOPPEMENT/TEST**
- **Nom**: SecondDetailDeck
- **ID**: `shxnokjzkfnreolujhew`
- **URL**: https://shxnokjzkfnreolujhew.supabase.co
- **Usage**: Tests, développement, validation

## 🔧 **CONFIGURATION**

### **Fichiers d'environnement**
```bash
# Pour développement local
cp .env.example .env.local
# Puis éditez .env.local avec vos credentials

# Fichier de dev pré-configuré
.env.development  # Pointe vers SecondDetailDeck
```

### **Scripts disponibles**
```bash
# Développement avec base de test
npm run dev:test     # Mode développement + DB test

# Développement avec base de prod (lecture seule)
npm run dev:prod     # Mode production + DB prod

# Build pour test
npm run build:test   # Build avec config de test

# Build pour production
npm run build        # Build pour déploiement

# Vérifier quelle DB est utilisée
npm run test:db      # Affiche DB de test
npm run prod:db      # Affiche DB de prod
```

## 🔄 **WORKFLOW DE DÉVELOPPEMENT**

### **1. Développement de nouvelles fonctionnalités**
```bash
# 1. Travailler sur la branche de dev
git checkout -b feature/nouvelle-fonctionnalite

# 2. Lancer en mode test
npm run dev:test

# 3. Tester sur SecondDetailDeck
# - Onboarding complet
# - Compte démo
# - Toutes les fonctionnalités

# 4. Une fois validé, merger vers main
git checkout main
git merge feature/nouvelle-fonctionnalite
```

### **2. Mise à jour de la base de données**
```bash
# Si vous devez modifier le schéma:
# 1. Testez d'abord sur SecondDetailDeck
# 2. Validez que tout fonctionne
# 3. Seulement après, appliquez en production
```

### **3. Déploiement**
```bash
# 1. Tests finaux
npm run dev:test

# 2. Build de production
npm run build

# 3. Déployer
# (Vercel se charge du déploiement automatique)
```

## ⚠️ **RÈGLES DE SÉCURITÉ**

### **🚨 ABSOLUMENT INTERDIT**
- ❌ Modifier la DB de production sans tests
- ❌ Utiliser `execute_sql` sur DetailDeck (jtusofarsnwcfxnrvgus)
- ❌ Supprimer des données de production

### **✅ AUTORISÉ**
- ✅ Tous les tests sur SecondDetailDeck (shxnokjzkfnreolujhew)
- ✅ Modifications de schéma sur la DB de test
- ✅ Seeding de données de test

## 🧪 **DONNÉES DE TEST**

### **Compte démo de test**
- Email: `demo@account.com`
- Password: `demoaccount`
- Shop: AutoClean Pro (données complètes)

### **Scripts de seeding**
```sql
-- À exécuter sur SecondDetailDeck uniquement
supabase/complete_demo_seeding.sql
```

## 🔍 **VALIDATION AVANT PRODUCTION**

### **Checklist de validation**
- [ ] Onboarding fonctionne (4 étapes)
- [ ] Compte démo avec données complètes
- [ ] Toutes les traductions présentes
- [ ] Aucune erreur TypeScript
- [ ] Tests sur mobile/desktop
- [ ] Performance acceptable

### **Commandes de vérification**
```bash
npm run lint          # Vérifier le code
npm run build:test    # Vérifier que ça build
npm run test:db       # Confirmer qu'on est sur la DB de test
```

---

**🎯 En cas de doute, TOUJOURS tester sur SecondDetailDeck avant la production !**
