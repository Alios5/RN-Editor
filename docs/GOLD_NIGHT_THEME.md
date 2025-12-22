# Thème Gold Night

## Description

Le thème **Gold Night** est un thème sombre élégant inspiré d'interfaces modernes avec une palette de couleurs bleu nuit profond et des accents jaune doré. Il offre un contraste élevé pour une meilleure lisibilité tout en conservant une esthétique raffinée.

## Palette de couleurs

### Couleurs principales

- **Fond principal** : Bleu nuit très foncé (`#0a0f1e` - HSL: 220 45% 5%)
- **Texte principal** : Blanc cassé (`#f7fafc` - HSL: 210 40% 98%)
- **Accent principal** : Jaune/Or (`#f5a524` - HSL: 38 92% 55%)
- **Accent secondaire** : Gris bleuté foncé (HSL: 220 35% 15%)

### Hiérarchie des fonds

1. **Background** (220 45% 5%) - Fond principal de l'application
2. **Card** (220 40% 10%) - Cartes et éléments surélevés
3. **Popover** (220 40% 12%) - Dialogues et menus contextuels

### Système d'accentuation

- **Primary** : Jaune/Or (38 92% 55%) - Boutons principaux, focus
- **Secondary** : Gris bleuté (220 35% 15%) - Éléments secondaires
- **Muted** : Gris bleuté clair (220 30% 12%) - Éléments atténués
- **Accent** : Combinaison gris + or pour les survols

### Bordures et séparateurs

- **Border** : Subtiles (220 30% 18%) - Bordures fines
- **Input** : Foncées (220 30% 15%) - Champs de saisie
- **Ring** : Or (38 92% 55%) - Focus et outline

### Couleurs spécifiques

#### Panneaux
- **Background** : (220 40% 10%) - Fond des panneaux latéraux
- **Border** : (220 30% 18%) - Bordures des panneaux
- **Icon Background** : (38 92% 55%) - Fond des icônes (jaune/or)
- **Input Background** : (220 30% 15%) - Fond des inputs dans les panneaux
- **Section Background** : (220 35% 12%) - Fond des sections

#### Pistes (Tracks)
- **Border** : (220 30% 20%) - Bordures des pistes
- **Grid Line** : (220 25% 15%) - Lignes de grille
- **Measure Line** : (38 92% 55%) - Lignes de mesure (or)

#### Formes d'onde
- **Waveform Color** : (38 85% 50%) - Couleur de la forme d'onde (orange/or)

## Utilisation

### Activer le thème

1. Ouvrir l'application RhythmNator Editor
2. Cliquer sur l'icône de palette (ThemeEditor)
3. Dans la liste déroulante, sélectionner **"Gold Night"**
4. Le thème s'applique immédiatement

### Personnalisation

Le thème Gold Night peut être personnalisé via l'éditeur de thème :
- Cliquer sur n'importe quelle couleur pour ouvrir le sélecteur
- Ajuster les valeurs HSL ou utiliser le sélecteur visuel
- Sauvegarder comme nouveau thème personnalisé

## Inspiration

Le thème Gold Night s'inspire des interfaces suivantes :
- Dashboards modernes avec fonds sombres
- Applications de gestion avec accents dorés
- Interfaces élégantes privilégiant le contraste et la lisibilité

## Caractéristiques

✅ **Contraste élevé** : Excellent pour de longues sessions de travail  
✅ **Accents distinctifs** : Le jaune/or attire l'attention sur les éléments importants  
✅ **Hiérarchie visuelle** : Niveaux de profondeur clairs grâce aux nuances de bleu  
✅ **Professionnelle** : Esthétique raffinée adaptée aux environnements professionnels  
✅ **Fatigue visuelle réduite** : Fond très sombre avec texte clair  

## Comparaison avec les autres thèmes

| Caractéristique | Default Dark | Light | Gold Night |
|-----------------|--------------|-------|------------|
| Fond principal | Bleu-gris moyen | Très clair | Bleu nuit très foncé |
| Accent | Violet | Violet | Jaune/Or |
| Contraste | Moyen | Élevé | Très élevé |
| Ambiance | Neutre | Claire | Élégante et moderne |

## Export et partage

Le thème Gold Night étant intégré par défaut, il est disponible sur toutes les installations. Vous pouvez également :

1. **Créer une variante** : Modifier les couleurs et sauvegarder comme nouveau thème
2. **Exporter** : Partager votre variante en fichier `.rntheme`
3. **Importer** : Charger des thèmes partagés par la communauté

## Développement

Pour modifier le thème dans le code source :

```typescript
// Fichier : src/types/theme.ts

export const GOLD_NIGHT_THEME: Theme = {
  name: "Gold Night",
  colors: {
    background: "220 45% 5%",
    primary: "38 92% 55%",
    // ... autres couleurs
  },
};
```

Le thème est automatiquement ajouté à `BUILTIN_THEMES` et disponible via le `ThemeEditor`.
