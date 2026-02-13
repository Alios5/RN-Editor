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
    trackBeatPrimary: string;
    trackBeatSecondary: string;
    // Waveform colors
    waveformColor: string;
    waveformBackground: string;
    waveformOutline: string;
    // Playhead
    playheadLine: string;
  };
}

export const AMETHYST_THEME: Theme = {
  name: "Amethyst",
  colors: {
    background: "251 19% 12%",
    foreground: "250 36% 90%",
    card: "251 20% 16%",
    cardForeground: "250 36% 90%",
    popover: "251 20% 16%",
    popoverForeground: "250 36% 90%",
    primary: "263 33% 69%",
    primaryForeground: "251 19% 12%",
    secondary: "254 15% 38%",
    secondaryForeground: "250 36% 90%",
    muted: "254 21% 16%",
    mutedForeground: "259 10% 64%",
    accent: "272 16% 21%",
    accentForeground: "346 69% 84%",
    destructive: "360 69% 67%",
    destructiveForeground: "251 19% 12%",
    border: "252 19% 21%",
    input: "249 20% 19%",
    ring: "263 33% 69%",
    gradientStart: "263 33% 69%",
    gradientEnd: "280 30% 55%",
    // Panel colors
    panelBackground: "251 20% 16%",
    panelBorder: "252 19% 21%",
    panelIconBackground: "263 33% 69%",
    panelInputBackground: "249 20% 19%",
    panelSectionBackground: "254 15% 38%",
    // Track colors
    trackBorder: "252 19% 24%",
    trackGridLine: "262 19% 35%",
    trackMeasureLine: "263 30% 60%",
    trackBeatPrimary: "252 15% 19%",
    trackBeatSecondary: "251 19% 14%",
    // Waveform colors
    waveformColor: "263 28% 60%",
    waveformBackground: "251 20% 14%",
    waveformOutline: "263 30% 60%",
    // Playhead
    playheadLine: "263 50% 65%",
  },
};

export const DEFAULT_THEME: Theme = {
  name: "Default Dark",
  colors: {
    background: "225 7% 11%",
    foreground: "0 0% 94%",
    card: "228 7% 14%",
    cardForeground: "0 0% 94%",
    popover: "228 7% 14%",
    popoverForeground: "0 0% 94%",
    primary: "258 100% 68%",
    primaryForeground: "0 0% 100%",
    secondary: "227 10% 18%",
    secondaryForeground: "0 0% 94%",
    muted: "227 10% 18%",
    mutedForeground: "0 0% 63%",
    accent: "217 33% 17%",
    accentForeground: "208 100% 74%",
    destructive: "0 91% 71%",
    destructiveForeground: "0 0% 100%",
    border: "223 6% 21%",
    input: "223 6% 21%",
    ring: "258 100% 68%",
    gradientStart: "258 100% 68%",
    gradientEnd: "280 70% 55%",
    // Panel colors
    panelBackground: "228 7% 14%",
    panelBorder: "223 6% 21%",
    panelIconBackground: "258 100% 68%",
    panelInputBackground: "223 6% 21%",
    panelSectionBackground: "227 10% 18%",
    // Track colors
    trackBorder: "223 6% 24%",
    trackGridLine: "228 7% 18%",
    trackMeasureLine: "258 80% 60%",
    trackBeatPrimary: "227 10% 18%",
    trackBeatSecondary: "225 7% 14%",
    // Waveform colors
    waveformColor: "258 60% 60%",
    waveformBackground: "228 7% 12%",
    waveformOutline: "258 80% 60%",
    // Playhead
    playheadLine: "217 92% 65%",
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
    trackBeatPrimary: "210 40% 96%",
    trackBeatSecondary: "0 0% 100%",
    // Waveform colors
    waveformColor: "231 33% 61%",
    waveformBackground: "0 0% 100%",
    waveformOutline: "230 15% 70%",
    // Playhead
    playheadLine: "245 75% 60%",
  },
};

export const GOLD_NIGHT_THEME: Theme = {
  name: "Gold Night",
  colors: {
    background: "220 45% 5%",
    foreground: "210 40% 98%",
    card: "218 35% 14%",
    cardForeground: "210 40% 98%",
    popover: "220 40% 12%",
    popoverForeground: "210 40% 98%",
    primary: "38 92% 55%",
    primaryForeground: "220 45% 5%",
    secondary: "218 35% 14%",
    secondaryForeground: "210 40% 98%",
    muted: "220 30% 12%",
    mutedForeground: "215 20% 65%",
    accent: "220 35% 15%",
    accentForeground: "38 92% 55%",
    destructive: "0 62.8% 50%",
    destructiveForeground: "210 40% 98%",
    border: "218 40% 12%",
    input: "220 30% 15%",
    ring: "38 92% 55%",
    gradientStart: "38 92% 55%",
    gradientEnd: "35 85% 50%",
    panelBackground: "218 35% 14%",
    panelBorder: "220 30% 18%",
    panelIconBackground: "38 92% 55%",
    panelInputBackground: "218 35% 14%",
    panelSectionBackground: "218 35% 14%",
    trackBorder: "220 30% 20%",
    trackGridLine: "224 23% 28%",
    trackMeasureLine: "38 92% 55%",
    trackBeatPrimary: "218 35% 17%",
    trackBeatSecondary: "220 35% 11%",
    waveformColor: "38 85% 50%",
    waveformBackground: "220 40% 12%",
    waveformOutline: "38 92% 55%",
    // Playhead
    playheadLine: "38 92% 55%",
  },
};

export const WINTER_THEME: Theme = {
  name: "Winter",
  colors: {
    background: "0 0% 100%",
    foreground: "210 44% 26%",
    card: "208 19% 53%",
    cardForeground: "210 44% 26%",
    popover: "0 0% 100%",
    popoverForeground: "210 44% 26%",
    primary: "210 100% 51%",
    primaryForeground: "0 0% 100%",
    secondary: "227 29% 72%",
    secondaryForeground: "0 0% 100%",
    muted: "210 62% 95%",
    mutedForeground: "210 24% 40%",
    accent: "224 100% 92%",
    accentForeground: "223 44% 17%",
    destructive: "0 50% 73%",
    destructiveForeground: "0 86% 10%",
    border: "215 50% 91%",
    input: "217 51% 91%",
    ring: "210 100% 51%",
    gradientStart: "210 100% 51%",
    gradientEnd: "250 45% 44%",
    panelBackground: "211 37% 89%",
    panelBorder: "210 62% 95%",
    panelIconBackground: "210 100% 51%",
    panelInputBackground: "211 63% 90%",
    panelSectionBackground: "211 25% 79%",
    trackBorder: "216 26% 64%",
    trackGridLine: "218 36% 80%",
    trackMeasureLine: "210 100% 51%",
    trackBeatPrimary: "211 100% 96%",
    trackBeatSecondary: "0 0% 100%",
    waveformColor: "211 38% 45%",
    waveformBackground: "213 100% 96%",
    waveformOutline: "215 50% 91%",
    // Playhead
    playheadLine: "200 80% 55%",
  },
};

export const T3_CHAT_THEME: Theme = {
  name: "T3 Chat",
  colors: {
    background: "270 15% 13%",
    foreground: "272 28% 82%",
    card: "270 14% 17%",
    cardForeground: "325 23% 82%",
    popover: "320 23% 5%",
    popoverForeground: "326 33% 96%",
    primary: "332 100% 32%",
    primaryForeground: "329 59% 85%",
    secondary: "274 15% 21%",
    secondaryForeground: "270 30% 83%",
    muted: "273 14% 15%",
    mutedForeground: "269 21% 76%",
    accent: "272 20% 27%",
    accentForeground: "326 33% 96%",
    destructive: "351 53% 37%",
    destructiveForeground: "0 0% 100%",
    border: "327 8% 21%",
    input: "312 9% 22%",
    ring: "333 71% 51%",
    gradientStart: "332 100% 32%",
    gradientEnd: "333 71% 51%",
    // Panel colors
    panelBackground: "270 14% 17%",
    panelBorder: "327 8% 21%",
    panelIconBackground: "332 100% 32%",
    panelInputBackground: "312 9% 22%",
    panelSectionBackground: "274 15% 21%",
    // Track colors
    trackBorder: "327 8% 24%",
    trackGridLine: "270 14% 25%",
    trackMeasureLine: "333 60% 45%",
    trackBeatPrimary: "274 15% 21%",
    trackBeatSecondary: "270 15% 15%",
    // Waveform colors
    waveformColor: "333 60% 45%",
    waveformBackground: "270 15% 14%",
    waveformOutline: "333 71% 51%",
    // Playhead
    playheadLine: "333 71% 51%",
  },
};

export const BUILTIN_THEMES: Theme[] = [AMETHYST_THEME, DEFAULT_THEME, LIGHT_THEME, GOLD_NIGHT_THEME, WINTER_THEME, T3_CHAT_THEME];
