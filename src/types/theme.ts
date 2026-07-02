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
    background: "270 5% 8%",
    foreground: "0 0% 96%",
    card: "270 5% 8%",
    cardForeground: "0 0% 96%",
    popover: "270 5% 8%",
    popoverForeground: "0 0% 96%",
    primary: "42 92% 58%",
    primaryForeground: "0 0% 0%",
    secondary: "270 5% 8%",
    secondaryForeground: "0 0% 96%",
    muted: "270 4% 12%",
    mutedForeground: "0 0% 55%",
    accent: "0 0% 25%",
    accentForeground: "0 0% 96%",
    destructive: "12 65% 52%",
    destructiveForeground: "0 0% 96%",
    border: "0 0% 18%",
    input: "0 0% 22%",
    ring: "42 92% 58%",
    gradientStart: "42 92% 58%",
    gradientEnd: "38 85% 50%",
    panelBackground: "270 5% 10%",
    panelBorder: "270 4% 15%",
    panelIconBackground: "42 92% 58%",
    panelInputBackground: "270 5% 10%",
    panelSectionBackground: "270 5% 10%",
    trackBorder: "0 0% 20%",
    trackGridLine: "270 4% 18%",
    trackMeasureLine: "42 92% 58%",
    trackBeatPrimary: "270 4% 14%",
    trackBeatSecondary: "270 5% 10%",
    waveformColor: "42 80% 50%",
    waveformBackground: "270 5% 9%",
    waveformOutline: "42 92% 58%",
    // Playhead
    playheadLine: "42 92% 58%",
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

export const WARM_SAND_THEME: Theme = {
  name: "Warm Sand",
  colors: {
    background: "60 5% 7%",
    foreground: "50 30% 96%",
    card: "60 3% 11%",
    cardForeground: "50 30% 96%",
    popover: "60 3% 11%",
    popoverForeground: "50 30% 96%",
    primary: "40 46% 69%",
    primaryForeground: "60 5% 7%",
    secondary: "36 6% 17%",
    secondaryForeground: "50 30% 96%",
    muted: "60 3% 14%",
    mutedForeground: "40 8% 61%",
    accent: "40 46% 69%",
    accentForeground: "60 5% 7%",
    destructive: "0 84% 60%",
    destructiveForeground: "50 30% 96%",
    border: "36 6% 17%",
    input: "36 6% 17%",
    ring: "40 46% 69%",
    gradientStart: "40 46% 69%",
    gradientEnd: "36 30% 55%",
    panelBackground: "60 3% 11%",
    panelBorder: "36 6% 15%",
    panelIconBackground: "40 46% 69%",
    panelInputBackground: "60 3% 11%",
    panelSectionBackground: "60 3% 11%",
    trackBorder: "36 6% 20%",
    trackGridLine: "60 3% 14%",
    trackMeasureLine: "40 46% 69%",
    trackBeatPrimary: "60 3% 14%",
    trackBeatSecondary: "60 5% 10%",
    waveformColor: "40 40% 55%",
    waveformBackground: "60 5% 9%",
    waveformOutline: "40 46% 69%",
    // Playhead
    playheadLine: "40 46% 69%",
  },
};

export const CAFFE_LATTE_THEME: Theme = {
  name: "Caffé Laté",
  colors: {
    background: "48 100% 97%",
    foreground: "240 2% 10%",
    card: "48 100% 97%",
    cardForeground: "240 2% 10%",
    popover: "48 100% 97%",
    popoverForeground: "240 2% 10%",
    primary: "41 100% 62%",
    primaryForeground: "0 0% 9%",
    secondary: "34 66% 93%",
    secondaryForeground: "240 2% 10%",
    muted: "47 47% 94%",
    mutedForeground: "0 0% 45%",
    accent: "0 0% 96%",
    accentForeground: "240 2% 10%",
    destructive: "352 100% 41%",
    destructiveForeground: "0 0% 100%",
    border: "0 0% 90%",
    input: "0 0% 90%",
    ring: "41 100% 62%",
    gradientStart: "41 100% 62%",
    gradientEnd: "30 90% 55%",
    // Panel colors
    panelBackground: "48 100% 97%",
    panelBorder: "0 0% 90%",
    panelIconBackground: "41 100% 62%",
    panelInputBackground: "0 0% 90%",
    panelSectionBackground: "34 66% 93%",
    // Track colors
    trackBorder: "0 0% 80%",
    trackGridLine: "0 0% 85%",
    trackMeasureLine: "41 100% 62%",
    trackBeatPrimary: "47 47% 94%",
    trackBeatSecondary: "48 100% 97%",
    // Waveform colors
    waveformColor: "41 100% 62%",
    waveformBackground: "48 100% 97%",
    waveformOutline: "41 100% 62%",
    // Playhead
    playheadLine: "41 100% 62%",
  },
};

export const BUILTIN_THEMES: Theme[] = [AMETHYST_THEME, DEFAULT_THEME, LIGHT_THEME, CAFFE_LATTE_THEME, GOLD_NIGHT_THEME, WARM_SAND_THEME, WINTER_THEME, T3_CHAT_THEME];
