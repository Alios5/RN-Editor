/**
 * Helper functions to get panel color CSS variable values
 * These variables are defined in index.css and update automatically when the theme changes
 */

export const panelColors = {
  background: () => 'var(--panel-background-color)',
  border: () => 'var(--panel-border-color)',
  iconBackground: () => 'var(--panel-icon-background-color)',
  inputBackground: () => 'var(--panel-input-background-color)',
  sectionBackground: () => 'var(--panel-section-background-color)',
} as const;

/**
 * Helper functions to get track-specific color CSS variable values
 * Separate from general panel colors for better customization
 */
export const trackColors = {
  border: () => 'var(--track-border-color)',
  gridLine: () => 'var(--track-grid-line-color)',
  measureLine: () => 'var(--track-measure-line-color)',
} as const;
