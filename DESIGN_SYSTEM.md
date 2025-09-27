# TrustCap Design System

Un système de design moderne et cohérent pour l'application DetailDeck, basé sur les spécifications TrustCap Design System.

## 📋 Table des Matières

- [Installation](#installation)
- [Tokens de Design](#tokens-de-design)
- [Composants](#composants)
- [Utilisation](#utilisation)
- [Guidelines](#guidelines)

## 🚀 Installation

### Importation TypeScript/JavaScript

```typescript
import { designSystem, designTokens, componentStyles } from './lib/designSystem';

// Utiliser les tokens
const primaryColor = designTokens.colors.primary;
const buttonStyles = componentStyles.buttons.primary;
```

### Importation CSS

```css
/* Dans votre fichier CSS principal */
@import './styles/designSystem.css';
```

```html
<!-- Ou dans votre HTML -->
<link rel="stylesheet" href="./styles/designSystem.css">
```

## 🎨 Tokens de Design

### Couleurs

```typescript
// Couleurs principales
designTokens.colors.primary        // #8895F5
designTokens.colors.primaryLight   // #F7F7FD
designTokens.colors.secondary      // #88B5F5
designTokens.colors.neutralDark    // #000000
designTokens.colors.neutralLight   // #F9FAFB
designTokens.colors.background     // #FFFFFF
```

### Typographie

```typescript
// Police
designTokens.typography.fontFamily.primary  // 'Montserrat'

// Tailles
designTokens.typography.fontSize.heading     // 90px
designTokens.typography.fontSize.subHeading  // 60px
designTokens.typography.fontSize.body        // 18px

// Poids
designTokens.typography.fontWeight.bold      // 700
designTokens.typography.fontWeight.semiBold  // 600
```

### Espacement

```typescript
// Système basé sur 8px
designTokens.spacing.xs    // 4px
designTokens.spacing.sm    // 8px
designTokens.spacing.md    // 16px
designTokens.spacing.lg    // 24px
designTokens.spacing.xl    // 32px
```

## 🧩 Composants

### Boutons

#### React/TypeScript
```typescript
import { componentStyles } from './lib/designSystem';

const PrimaryButton = styled.button`
  ${componentStyles.buttons.primary}
`;
```

#### CSS Classes
```html
<button class="btn btn-primary">Bouton Principal</button>
<button class="btn btn-secondary">Bouton Secondaire</button>
<button class="btn btn-ghost">Bouton Fantôme</button>
```

#### Tailwind CSS
```html
<button class="bg-gradient-to-r from-[#8895F5] to-[#88B5F5] text-white rounded-lg px-7 py-3.5 font-semibold hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
  Bouton Principal
</button>
```

### Cartes

#### CSS Classes
```html
<div class="card">
  <h3>Titre de la carte</h3>
  <p>Contenu de la carte</p>
</div>
```

#### Tailwind CSS
```html
<div class="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200">
  Contenu de la carte
</div>
```

### Formulaires

#### CSS Classes
```html
<div>
  <label class="form-label">Nom du champ</label>
  <input type="text" class="form-input" placeholder="Entrez votre texte">
  <div class="form-error">Message d'erreur</div>
</div>
```

### Typographie

#### CSS Classes
```html
<h1 class="heading">Titre Principal</h1>
<h2 class="sub-heading">Sous-titre</h2>
<p class="body-text">Texte de contenu</p>
```

## 📐 Layout

### Container et Sections

```html
<div class="container">
  <section class="section">
    <div class="hero-section">
      <h1 class="heading">Titre Hero</h1>
      <p class="body-text">Description</p>
      <button class="btn btn-primary">Action</button>
    </div>
  </section>
</div>
```

### CTA Banner

```html
<div class="cta-banner">
  <h2 class="sub-heading">Appel à l'action</h2>
  <button class="btn btn-primary">Commencer</button>
</div>
```

## 🎯 Guidelines d'Utilisation

### Gradients
- **Usage** : Uniquement pour les boutons primaires et les arrière-plans hero
- **Éviter** : Sur-utilisation des gradients dans l'interface

### Coins Arrondis
- **Boutons** : 8px (`--radius-md`)
- **Cartes** : 16px (`--radius-xl`)
- **Modales** : 16px (`--radius-xl`)

### Ombres
- **Principe** : Ombres très subtiles pour créer de la profondeur
- **Cartes** : `--shadow-md` (0 2px 8px rgba(0,0,0,0.05))
- **Hover** : `--shadow-lg` (0 4px 16px rgba(0,0,0,0.08))

### Espacement
- **Règle** : Utiliser des multiples de 8px
- **Sections** : 80px de padding vertical
- **Composants** : 16px d'espacement entre éléments
- **Hero** : 120px de padding vertical

## 🎨 Couleurs Étendues

### Palette de Gris
```css
--color-gray-50: #F9FAFB   /* Arrière-plans très clairs */
--color-gray-100: #F3F4F6  /* Arrière-plans clairs */
--color-gray-200: #E5E7EB  /* Bordures */
--color-gray-300: #D1D5DB  /* Bordures actives */
--color-gray-400: #9CA3AF  /* Placeholders */
--color-gray-500: #6B7280  /* Texte secondaire */
--color-gray-600: #4B5563  /* Texte tertiaire */
--color-gray-700: #374151  /* Texte principal */
--color-gray-800: #1F2937  /* Titres */
--color-gray-900: #111827  /* Texte très foncé */
```

### Couleurs de Statut
```css
--color-success: #10B981  /* Succès */
--color-warning: #F59E0B  /* Avertissement */
--color-error: #EF4444    /* Erreur */
--color-info: #3B82F6     /* Information */
```

## 📱 Responsive Design

### Breakpoints
- **sm** : 640px
- **md** : 768px
- **lg** : 1024px
- **xl** : 1280px
- **2xl** : 1536px

### Typographie Responsive
- **Mobile** : Tailles réduites (36px pour heading, 24px pour sub-heading)
- **Tablet** : Tailles moyennes (48px pour heading, 32px pour sub-heading)
- **Desktop** : Tailles complètes (90px pour heading, 60px pour sub-heading)

## 🔄 Animations

### Transitions Standard
```css
--transition-fast: 0.15s ease     /* Micro-interactions */
--transition-normal: 0.2s ease    /* Interactions standard */
--transition-slow: 0.3s ease      /* Transitions complexes */
```

### Effets Hover
- **Boutons** : Transform translateY(-1px) + shadow
- **Cartes** : Transform translateY(-2px) + shadow
- **Links** : Changement de couleur d'arrière-plan

## 🛠️ Intégration avec Tailwind CSS

Le design system est compatible avec Tailwind CSS. Utilisez les classes utilitaires fournies ou créez vos propres composants :

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#8895F5',
        'primary-light': '#F7F7FD',
        secondary: '#88B5F5',
      },
      fontFamily: {
        'primary': ['Montserrat', 'sans-serif'],
      },
      fontSize: {
        'heading': '90px',
        'sub-heading': '60px',
      },
    },
  },
}
```

## 📝 Exemples d'Implémentation

### Page Hero Complète
```html
<div class="hero-section">
  <div class="container">
    <h1 class="heading mb-lg">Titre Principal</h1>
    <p class="body-text mb-xl">Description de votre service</p>
    <button class="btn btn-primary">Commencer</button>
  </div>
</div>
```

### Carte de Témoignage
```html
<div class="card-testimonial">
  <img src="avatar.jpg" alt="Client" style="width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 16px;">
  <p class="body-text mb-md">"Excellent service, je recommande vivement!"</p>
  <div>
    <strong>Jean Dupont</strong>
    <div style="font-size: 14px; color: var(--color-gray-500);">Client satisfait</div>
  </div>
</div>
```

---

## 🤝 Contribution

Pour contribuer au design system :

1. Respectez les guidelines existantes
2. Utilisez le système d'espacement 8px
3. Testez sur tous les breakpoints
4. Documentez vos ajouts
5. Maintenez la cohérence visuelle

---

**TrustCap Design System** - Pour une interface moderne, cohérente et accessible. 🎨✨





