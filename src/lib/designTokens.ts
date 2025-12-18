/**
 * Design System - Single Source of Truth
 * =======================================
 * Ce fichier centralise toutes les constantes de design du projet.
 * Toute modification de style doit passer par ce fichier pour garantir la cohérence.
 */

// =============================================================================
// COULEURS PRÉDÉFINIES
// =============================================================================

/**
 * Palette de couleurs pour les pistes (tracks)
 * Utilisée dans CreateTrackDialog et EditTrackDialog
 */
export const TRACK_PRESET_COLORS = [
  "#FFFFFF", // Blanc
  "#EF4444", // Rouge
  "#3B82F6", // Bleu
  "#10B981", // Vert
  "#F59E0B", // Orange
  "#8B5CF6", // Violet
  "#EC4899", // Rose
  "#F97316", // Orange foncé
  "#06B6D4", // Cyan
  "#84CC16", // Lime
] as const;

export type TrackPresetColor = typeof TRACK_PRESET_COLORS[number];

// =============================================================================
// ESPACEMENTS
// =============================================================================

/**
 * Classes d'espacement standardisées
 */
export const SPACING = {
  /** Espacement entre sections dans les panneaux */
  sectionGap: "space-y-4",
  /** Espacement entre éléments dans une section */
  itemGap: "space-y-3",
  /** Espacement entre labels et inputs */
  labelGap: "space-y-2",
  /** Padding des dialogues */
  dialogPadding: "py-4",
  /** Gap dans les grilles */
  gridGap: "gap-2",
  /** Gap dans les grilles plus espacées */
  gridGapLg: "gap-3",
} as const;

// =============================================================================
// TAILLES
// =============================================================================

/**
 * Tailles standardisées pour les éléments UI
 */
export const SIZES = {
  /** Hauteur des inputs compacts */
  inputCompact: "h-9",
  /** Hauteur des inputs standard */
  inputDefault: "h-10",
  /** Hauteur des boutons compacts */
  buttonCompact: "h-8",
  /** Hauteur des boutons standard */
  buttonDefault: "h-9",
  /** Taille des icônes dans les panneaux */
  panelIconContainer: "h-7 w-7",
  /** Taille des icônes */
  iconSm: "h-3 w-3",
  iconMd: "h-4 w-4",
  iconLg: "h-5 w-5",
  /** Grille de sélection de couleurs */
  colorGridCols: "grid-cols-5",
  /** Grille de sélection d'icônes */
  iconGridCols: "grid-cols-8",
  /** Hauteur des boutons de couleur */
  colorButtonHeight: "h-10",
} as const;

// =============================================================================
// CLASSES DE STYLE COMMUNES
// =============================================================================

/**
 * Classes CSS réutilisables
 */
export const STYLES = {
  /** Message d'erreur sous les inputs */
  errorMessage: "text-sm text-destructive",
  /** Texte d'aide sous les inputs */
  helpText: "text-xs text-muted-foreground",
  /** Label de section dans les panneaux */
  sectionLabel: "text-xs font-medium text-muted-foreground",
  /** Label de champ */
  fieldLabel: "text-xs text-muted-foreground",
  /** Séparateur horizontal */
  divider: "border-t border-border/50",
  /** Bouton de couleur sélectionné */
  colorButtonSelected: "border-primary ring-2 ring-primary ring-offset-2",
  /** Bouton de couleur non sélectionné */
  colorButtonDefault: "border-border",
  /** Bouton de couleur (base) */
  colorButton: "rounded-md border-2 transition-all hover:scale-110",
  /** Grille d'icônes */
  iconGrid: "p-4 border rounded-lg bg-muted/30 max-h-64 overflow-y-auto",
  /** Bouton d'icône sélectionné */
  iconButtonSelected: "bg-primary text-primary-foreground border-primary",
  /** Bouton d'icône non sélectionné */
  iconButtonDefault: "bg-background border-border",
  /** Bouton d'icône (base) */
  iconButton: "p-3 rounded-lg border transition-all hover:bg-accent",
  /** Container de preview */
  previewContainer: "p-4 border rounded-lg bg-accent/50",
  /** Message vide (no items) */
  emptyMessage: "text-center py-4 text-muted-foreground text-xs",
  /** Card dans les panneaux */
  panelCard: "m-4 backdrop-blur-sm hover:scale-100 transition-none shadow-sm",
  /** Header de card */
  panelCardHeader: "pb-3 pt-4",
  /** Titre de card */
  panelCardTitle: "text-sm font-semibold flex items-center gap-2",
  /** Container d'icône de panneau */
  panelIconContainer: "h-7 w-7 rounded-md flex items-center justify-center",
} as const;

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Limites de validation
 */
export const VALIDATION = {
  /** Longueur max du nom de piste/groupe/action */
  maxNameLength: 50,
  /** Longueur max du nom de projet */
  maxProjectNameLength: 100,
} as const;

// =============================================================================
// ANIMATIONS
// =============================================================================

/**
 * Classes d'animation
 */
export const ANIMATIONS = {
  /** Animation de pulsation (loading) */
  pulse: "animate-pulse",
  /** Animation de fade in */
  fadeIn: "animate-fade-in",
} as const;

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Génère les classes pour un bouton de couleur
 */
export function getColorButtonClasses(isSelected: boolean): string {
  return `${SIZES.colorButtonHeight} ${STYLES.colorButton} ${
    isSelected ? STYLES.colorButtonSelected : STYLES.colorButtonDefault
  }`;
}

/**
 * Génère les classes pour un bouton d'icône
 */
export function getIconButtonClasses(isSelected: boolean): string {
  return `${STYLES.iconButton} ${
    isSelected ? STYLES.iconButtonSelected : STYLES.iconButtonDefault
  }`;
}

/**
 * Tronque une chaîne à la longueur maximale
 */
export function truncateToMaxLength(value: string, maxLength: number = VALIDATION.maxNameLength): string {
  return value.slice(0, maxLength);
}
