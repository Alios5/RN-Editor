import { Theme, DEFAULT_THEME, BUILTIN_THEMES } from "@/types/theme";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";

const THEME_STORAGE_KEY = "rhythmnator_theme";
const SAVED_THEMES_KEY = "rhythmnator_saved_themes";

/**
 * Load the current theme from localStorage
 */
export const loadTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      const theme = JSON.parse(stored) as Partial<Theme>;
      
      // Migration: Add missing properties for old themes
      const needsMigration = 
        !theme.colors?.gradientStart || 
        !theme.colors?.gradientEnd ||
        !theme.colors?.panelBackground ||
        !theme.colors?.panelBorder ||
        !theme.colors?.panelIconBackground ||
        !theme.colors?.panelInputBackground ||
        !theme.colors?.panelSectionBackground ||
        !theme.colors?.trackBorder ||
        !theme.colors?.trackGridLine ||
        !theme.colors?.trackMeasureLine ||
        !theme.colors?.waveformColor;
        
      if (needsMigration) {
        // Detect if it's a light or dark theme by checking background lightness
        // Light theme has background like "0 0% 100%" (lightness 100%)
        // Dark theme has background like "230 35% 7%" (lightness 7%)
        const isLightTheme = theme.colors?.background?.includes('100%') || 
                            theme.name?.toLowerCase().includes('light');
        
        const baseTheme = isLightTheme ? BUILTIN_THEMES.find(t => t.name === "Light Theme") || DEFAULT_THEME : DEFAULT_THEME;
        
        const migratedTheme = {
          ...baseTheme,
          ...theme,
          colors: {
            ...baseTheme.colors,
            ...theme.colors,
          }
        } as Theme;
        
        // Save the migrated theme
        saveTheme(migratedTheme);
        console.log(`✅ Theme migrated: ${isLightTheme ? 'Light' : 'Dark'} theme with panel colors`);
        return migratedTheme;
      }
      
      return theme as Theme;
    }
  } catch (error) {
    console.error("Error loading theme:", error);
  }
  return DEFAULT_THEME;
};

/**
 * Save theme to localStorage
 */
export const saveTheme = (theme: Theme): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
  } catch (error) {
    console.error("Error saving theme:", error);
  }
};

/**
 * Apply a theme to the document by updating CSS variables
 */
export const applyTheme = (theme: Theme): void => {
  const root = document.documentElement;
  
  Object.entries(theme.colors).forEach(([key, value]) => {
    // Convert camelCase to kebab-case for CSS variables
    const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    root.style.setProperty(`--${cssVar}`, value);
  });
  
  saveTheme(theme);
};

/**
 * Export theme to a JSON file
 */
export const exportTheme = async (theme: Theme): Promise<void> => {
  try {
    const filePath = await save({
      defaultPath: `${theme.name.replace(/\s+/g, '_')}.rntheme`,
      filters: [{
        name: 'RhythmNator Theme',
        extensions: ['rntheme']
      }]
    });

    if (filePath) {
      const themeJson = JSON.stringify(theme, null, 2);
      await writeTextFile(filePath, themeJson);
    }
  } catch (error) {
    console.error("Error exporting theme:", error);
    throw error;
  }
};

/**
 * Import theme from a JSON file
 */
export const importTheme = async (): Promise<Theme | null> => {
  try {
    const selected = await open({
      multiple: false,
      filters: [{
        name: 'RhythmNator Theme',
        extensions: ['rntheme', 'json']
      }]
    });

    if (selected && typeof selected === 'string') {
      const content = await readTextFile(selected);
      const theme = JSON.parse(content) as Partial<Theme>;
      
      // Validate theme structure
      if (!theme.name || !theme.colors) {
        throw new Error("Invalid theme file format");
      }
      
      // Migration: Add missing properties for imported themes
      const needsMigration = 
        !theme.colors.gradientStart || 
        !theme.colors.gradientEnd ||
        !theme.colors.panelBackground ||
        !theme.colors.panelBorder ||
        !theme.colors.panelIconBackground ||
        !theme.colors.panelInputBackground ||
        !theme.colors.panelSectionBackground ||
        !theme.colors.trackBorder ||
        !theme.colors.trackGridLine ||
        !theme.colors.trackMeasureLine ||
        !theme.colors.waveformColor;
        
      if (needsMigration) {
        return {
          ...DEFAULT_THEME,
          ...theme,
          colors: {
            ...DEFAULT_THEME.colors,
            ...theme.colors,
          }
        } as Theme;
      }
      
      return theme as Theme;
    }
  } catch (error) {
    console.error("Error importing theme:", error);
    throw error;
  }
  
  return null;
};

/**
 * Reset to default theme
 */
export const resetToDefaultTheme = (): void => {
  applyTheme(DEFAULT_THEME);
};

/**
 * Get all saved themes (builtin + user saved)
 */
export const getSavedThemes = (): Theme[] => {
  try {
    const stored = localStorage.getItem(SAVED_THEMES_KEY);
    const userThemes: Partial<Theme>[] = stored ? JSON.parse(stored) : [];
    
    // Migration: Add missing properties for old themes
    const migratedUserThemes = userThemes.map(theme => {
      const needsMigration = 
        !theme.colors?.gradientStart || 
        !theme.colors?.gradientEnd ||
        !theme.colors?.panelBackground ||
        !theme.colors?.panelBorder ||
        !theme.colors?.panelIconBackground ||
        !theme.colors?.panelInputBackground ||
        !theme.colors?.panelSectionBackground ||
        !theme.colors?.trackBorder ||
        !theme.colors?.trackGridLine ||
        !theme.colors?.trackMeasureLine ||
        !theme.colors?.waveformColor;
        
      if (needsMigration) {
        return {
          ...DEFAULT_THEME,
          ...theme,
          colors: {
            ...DEFAULT_THEME.colors,
            ...theme.colors,
          }
        } as Theme;
      }
      return theme as Theme;
    });
    
    return [...BUILTIN_THEMES, ...migratedUserThemes];
  } catch (error) {
    console.error("Error loading saved themes:", error);
    return BUILTIN_THEMES;
  }
};

/**
 * Save a new custom theme
 */
export const saveCustomTheme = (theme: Theme): void => {
  try {
    const stored = localStorage.getItem(SAVED_THEMES_KEY);
    const existingThemes: Theme[] = stored ? JSON.parse(stored) : [];
    
    // Check if theme with same name exists
    const existingIndex = existingThemes.findIndex(t => t.name === theme.name);
    
    if (existingIndex >= 0) {
      // Update existing theme
      existingThemes[existingIndex] = theme;
    } else {
      // Add new theme
      existingThemes.push(theme);
    }
    
    localStorage.setItem(SAVED_THEMES_KEY, JSON.stringify(existingThemes));
  } catch (error) {
    console.error("Error saving custom theme:", error);
    throw error;
  }
};

/**
 * Delete a custom theme
 */
export const deleteCustomTheme = (themeName: string): void => {
  try {
    const stored = localStorage.getItem(SAVED_THEMES_KEY);
    const existingThemes: Theme[] = stored ? JSON.parse(stored) : [];
    
    const filteredThemes = existingThemes.filter(t => t.name !== themeName);
    localStorage.setItem(SAVED_THEMES_KEY, JSON.stringify(filteredThemes));
  } catch (error) {
    console.error("Error deleting custom theme:", error);
    throw error;
  }
};

/**
 * Check if a theme is a builtin theme (cannot be deleted)
 */
export const isBuiltinTheme = (themeName: string): boolean => {
  return BUILTIN_THEMES.some(t => t.name === themeName);
};

/**
 * Parse HSL string to components
 */
export const parseHSL = (hsl: string): { h: number; s: number; l: number } => {
  if (!hsl) {
    return { h: 0, s: 0, l: 0 };
  }
  const parts = hsl.trim().split(/\s+/);
  return {
    h: parseInt(parts[0]) || 0,
    s: parseInt(parts[1]) || 0,
    l: parseInt(parts[2]) || 0
  };
};

/**
 * Format HSL components to string
 */
export const formatHSL = (h: number, s: number, l: number): string => {
  return `${h} ${s}% ${l}%`;
};

/**
 * Convert HSL string (e.g., "230 35% 7%") to HEX color
 */
export const hslToHex = (hsl: string): string => {
  const { h, s, l } = parseHSL(hsl);
  
  const hDecimal = h / 360;
  const sDecimal = s / 100;
  const lDecimal = l / 100;

  let r, g, b;

  if (sDecimal === 0) {
    r = g = b = lDecimal;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = lDecimal < 0.5 ? lDecimal * (1 + sDecimal) : lDecimal + sDecimal - lDecimal * sDecimal;
    const p = 2 * lDecimal - q;

    r = hue2rgb(p, q, hDecimal + 1 / 3);
    g = hue2rgb(p, q, hDecimal);
    b = hue2rgb(p, q, hDecimal - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Convert HEX color to HSL string format
 */
export const hexToHsl = (hex: string): string => {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return formatHSL(
    Math.round(h * 360),
    Math.round(s * 100),
    Math.round(l * 100)
  );
};
