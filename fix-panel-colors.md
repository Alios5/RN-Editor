# Guide de remplacement des couleurs de panel

Pour chaque fichier qui utilise encore `hsl(var(--panel-...))`, remplacer par:

1. Ajouter l'import:
```ts
import { panelColors } from "@/lib/panelColors";
```

2. Remplacements:
- `'hsl(var(--panel-background))'` → `panelColors.background()`
- `'hsl(var(--panel-border))'` → `panelColors.border()`
- `'hsl(var(--panel-icon-background))'` → `panelColors.iconBackground()`
- `'hsl(var(--panel-input-background))'` → `panelColors.inputBackground()`
- `'hsl(var(--panel-section-background))'` → `panelColors.sectionBackground()`

## Fichiers à mettre à jour:
- Editor.tsx (4 occurrences)
- AudioPlayer.tsx (2 occurrences)
- ProjectPanel.tsx (2 occurrences)
- RhythmGrid.tsx (2 occurrences) 
- TracksPanel.tsx (2 occurrences)
- Waveform.tsx (2 occurrences)
- ProjectListItem.tsx (1 occurrence)
- SelectActionDialog.tsx (1 occurrence)
- SpecificActionsDialog.tsx (1 occurrence)
- TrackGroupsPanel.tsx (1 occurrence)
