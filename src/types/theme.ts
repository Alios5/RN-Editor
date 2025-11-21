export interface Theme {
  name: string;
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
    gradientStart: string;
    gradientEnd: string;
    // Panel colors
    panelBackground: string;
    panelBorder: string;
    panelIconBackground: string;
    panelInputBackground: string;
    panelSectionBackground: string;
    // Track colors
    trackBorder: string;
    trackGridLine: string;
    trackMeasureLine: string;
    // Waveform colors
    waveformColor: string;
  };
}

export const DEFAULT_THEME: Theme = {
  name: "Default Dark",
  colors: {
    background: "230 35% 7%",
    foreground: "0 0% 98%",
    card: "228 23% 17%",
    cardForeground: "0 0% 98%",
    popover: "230 30% 10%",
    popoverForeground: "0 0% 98%",
    primary: "245 75% 60%",
    primaryForeground: "0 0% 100%",
    secondary: "230 25% 18%",
    secondaryForeground: "0 0% 98%",
    muted: "230 20% 20%",
    mutedForeground: "220 10% 60%",
    accent: "20 100% 50%",
    accentForeground: "0 0% 100%",
    destructive: "0 84.2% 60.2%",
    destructiveForeground: "0 0% 100%",
    border: "227 29% 13%",
    input: "230 25% 18%",
    ring: "245 75% 60%",
    gradientStart: "245 75% 60%",
    gradientEnd: "265 70% 55%",
    // Panel colors
    panelBackground: "228 22% 18%",
    panelBorder: "230 25% 20%",
    panelIconBackground: "245 75% 60%",
    panelInputBackground: "230 25% 18%",
    panelSectionBackground: "230 25% 18%",
    // Track colors
    trackBorder: "230 25% 25%",
    trackGridLine: "230 25% 22%",
    trackMeasureLine: "245 60% 50%",
    // Waveform colors
    waveformColor: "245 41% 49%",
  },
};

export const LIGHT_THEME: Theme = {
  name: "Light",
  colors: {
    background: "210 34% 89%",
    foreground: "222 47% 11%",
    card: "0 0% 100%",
    cardForeground: "222 47% 11%",
    popover: "0 0% 100%",
    popoverForeground: "222 47% 11%",
    primary: "245 75% 60%",
    primaryForeground: "0 0% 100%",
    secondary: "210 40% 96%",
    secondaryForeground: "222 47% 11%",
    muted: "210 40% 96%",
    mutedForeground: "215 16% 47%",
    accent: "210 40% 96%",
    accentForeground: "222 47% 11%",
    destructive: "0 84% 60%",
    destructiveForeground: "0 0% 100%",
    border: "222 34% 80%",
    input: "213 100% 98%",
    ring: "245 75% 60%",
    gradientStart: "245 75% 60%",
    gradientEnd: "265 70% 55%",
    // Panel colors
    panelBackground: "0 0% 100%",
    panelBorder: "0 0% 100%",
    panelIconBackground: "245 75% 60%",
    panelInputBackground: "0 0% 100%",
    panelSectionBackground: "210 40% 96%",
    // Track colors
    trackBorder: "230 15% 47%",
    trackGridLine: "230 16% 70%",
    trackMeasureLine: "245 60% 50%",
    // Waveform colors
    waveformColor: "231 33% 61%",
  },
};

export const BUILTIN_THEMES: Theme[] = [DEFAULT_THEME, LIGHT_THEME];
