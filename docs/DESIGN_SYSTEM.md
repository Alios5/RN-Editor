# Design System - RN-Editor

## Single Source of Truth

Ce document décrit l'architecture du design system du projet RN-Editor et les bonnes pratiques à suivre pour garantir la cohérence globale.

---

## 📁 Structure des fichiers

```
src/
├── lib/
│   ├── designTokens.ts    # ⭐ SINGLE SOURCE OF TRUTH - Tokens centralisés
│   ├── panelColors.ts     # Variables CSS pour les panneaux
│   ├── faIconMap.ts       # Mapping des icônes FontAwesome
│   └── utils.ts           # Utilitaires (cn, getContrastColor)
├── index.css              # Variables CSS HSL, thème, animations
└── components/
    └── ui/                # Composants Shadcn/UI (ne pas modifier)
```

---

## 🎨 Design Tokens (`src/lib/designTokens.ts`)

### Couleurs prédéfinies

```typescript
import { TRACK_PRESET_COLORS } from "@/lib/designTokens";

// Palette de couleurs pour les pistes
TRACK_PRESET_COLORS // ["#FFFFFF", "#EF4444", "#3B82F6", ...]
```

### Styles réutilisables

```typescript
import { STYLES } from "@/lib/designTokens";

STYLES.errorMessage      // "text-sm text-destructive"
STYLES.helpText          // "text-xs text-muted-foreground"
STYLES.sectionLabel      // "text-xs font-medium text-muted-foreground"
STYLES.divider           // "border-t border-border/50"
STYLES.emptyMessage      // "text-center py-4 text-muted-foreground text-xs"
STYLES.iconGrid          // "p-4 border rounded-lg bg-muted/30 max-h-64 overflow-y-auto"
STYLES.previewContainer  // "p-4 border rounded-lg bg-accent/50"
```

### Validation

```typescript
import { VALIDATION, truncateToMaxLength } from "@/lib/designTokens";

VALIDATION.maxNameLength       // 50
VALIDATION.maxProjectNameLength // 100

// Usage
const handleNameChange = (value: string) => {
  setName(truncateToMaxLength(value, VALIDATION.maxNameLength));
};
```

### Helpers

```typescript
import { getColorButtonClasses, getIconButtonClasses } from "@/lib/designTokens";

// Pour les boutons de sélection de couleur
<button className={getColorButtonClasses(isSelected)} />

// Pour les boutons de sélection d'icône
<button className={getIconButtonClasses(isSelected)} />
```

---

## 🎯 Bonnes pratiques

### ✅ À FAIRE

1. **Importer les tokens centralisés** au lieu de définir des constantes locales
2. **Utiliser `STYLES.*`** pour les classes CSS récurrentes
3. **Utiliser les helpers** (`getColorButtonClasses`, `truncateToMaxLength`)
4. **Ajouter les nouvelles constantes** dans `designTokens.ts` si elles sont utilisées à plusieurs endroits

### ❌ À ÉVITER

1. **Dupliquer des constantes** comme `PRESET_COLORS` dans plusieurs fichiers
2. **Hardcoder des classes CSS** récurrentes (ex: `"text-sm text-destructive"`)
3. **Hardcoder des limites** comme `50` pour la longueur des noms
4. **Créer des styles inline** répétitifs

---

## 🔧 Variables CSS (`src/index.css`)

### Couleurs principales (HSL)

```css
--background: 230 35% 7%;
--foreground: 0 0% 98%;
--primary: 245 75% 60%;
--secondary: 230 25% 18%;
--accent: 20 100% 50%;
--destructive: 0 84.2% 60.2%;
--muted: 230 20% 20%;
```

### Couleurs des panneaux

```css
--panel-background-color: hsl(var(--panel-background) / 0.3);
--panel-border-color: hsl(var(--panel-border) / 0.5);
--panel-icon-background-color: hsl(var(--panel-icon-background) / 0.1);
--panel-input-background-color: hsl(var(--panel-input-background) / 0.5);
```

### Utilisation avec `panelColors.ts`

```typescript
import { panelColors } from "@/lib/panelColors";

<div style={{ backgroundColor: panelColors.inputBackground() }} />
```

---

## 📦 Composants UI

### Shadcn/UI (`src/components/ui/`)

Ces composants sont gérés par Shadcn et ne doivent **pas être modifiés directement** sauf pour des cas exceptionnels. Ils utilisent automatiquement les variables CSS définies dans `index.css`.

### Composants métier (`src/components/`)

Ces composants doivent :
- Importer les tokens depuis `@/lib/designTokens`
- Utiliser les composants UI de `@/components/ui/`
- Suivre les patterns établis (dialogues, panneaux, etc.)

---

## 🔄 Migration d'un composant existant

Pour migrer un composant vers le design system centralisé :

1. **Identifier les constantes dupliquées** (couleurs, limites, etc.)
2. **Remplacer par les imports** depuis `designTokens.ts`
3. **Remplacer les classes CSS hardcodées** par `STYLES.*`
4. **Utiliser les helpers** pour la logique répétitive

### Exemple

**Avant:**
```typescript
const PRESET_COLORS = ["#FFFFFF", "#EF4444", ...];

const handleNameChange = (value: string) => {
  setName(value.slice(0, 50));
};

<p className="text-sm text-destructive">{error}</p>
```

**Après:**
```typescript
import { TRACK_PRESET_COLORS, STYLES, VALIDATION, truncateToMaxLength } from "@/lib/designTokens";

const handleNameChange = (value: string) => {
  setName(truncateToMaxLength(value, VALIDATION.maxNameLength));
};

<p className={STYLES.errorMessage}>{error}</p>
```

---

## 📋 Checklist de revue de code

- [ ] Les constantes sont-elles importées depuis `designTokens.ts` ?
- [ ] Les classes CSS récurrentes utilisent-elles `STYLES.*` ?
- [ ] Les limites de validation utilisent-elles `VALIDATION.*` ?
- [ ] Les nouveaux patterns sont-ils ajoutés au design system s'ils sont réutilisables ?
- [ ] Le composant suit-il la structure des composants existants similaires ?

---

## 🆕 Ajout d'un nouveau token

1. Ajouter la constante dans `src/lib/designTokens.ts`
2. Exporter avec `as const` pour le typage
3. Documenter l'usage prévu
4. Mettre à jour ce fichier si nécessaire

```typescript
// Dans designTokens.ts
export const NEW_CONSTANT = {
  value1: "...",
  value2: "...",
} as const;
```
