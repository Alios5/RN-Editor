import { createContext, useState, useEffect, ReactNode, useContext } from "react";

// Available fonts
export const availableFonts = [
  { name: "Finlandica", value: "'Finlandica', sans-serif", googleFont: "Finlandica:wght@300;400;500;600;700" },
  { name: "Inter", value: "'Inter', sans-serif", googleFont: "Inter:wght@300;400;500;600;700" },
  { name: "Roboto", value: "'Roboto', sans-serif", googleFont: "Roboto:wght@300;400;500;700" },
  { name: "Open Sans", value: "'Open Sans', sans-serif", googleFont: "Open+Sans:wght@300;400;500;600;700" },
  { name: "Poppins", value: "'Poppins', sans-serif", googleFont: "Poppins:wght@300;400;500;600;700" },
  { name: "Montserrat", value: "'Montserrat', sans-serif", googleFont: "Montserrat:wght@300;400;500;600;700" },
  { name: "Lato", value: "'Lato', sans-serif", googleFont: "Lato:wght@300;400;700" },
  { name: "Source Sans Pro", value: "'Source Sans 3', sans-serif", googleFont: "Source+Sans+3:wght@300;400;500;600;700" },
  { name: "Nunito", value: "'Nunito', sans-serif", googleFont: "Nunito:wght@300;400;500;600;700" },
  { name: "Raleway", value: "'Raleway', sans-serif", googleFont: "Raleway:wght@300;400;500;600;700" },
  { name: "Ubuntu", value: "'Ubuntu', sans-serif", googleFont: "Ubuntu:wght@300;400;500;700" },
  { name: "Outfit", value: "'Outfit', sans-serif", googleFont: "Outfit:wght@300;400;500;600;700" },
  { name: "Work Sans", value: "'Work Sans', sans-serif", googleFont: "Work+Sans:wght@300;400;500;600;700" },
  { name: "Quicksand", value: "'Quicksand', sans-serif", googleFont: "Quicksand:wght@300;400;500;600;700" },
  { name: "Josefin Sans", value: "'Josefin Sans', sans-serif", googleFont: "Josefin+Sans:wght@300;400;500;600;700" },
];

interface FontSettings {
  textFont: string;
  titleFont: string;
}

interface FontContextType {
  textFont: string;
  titleFont: string;
  setTextFont: (font: string) => void;
  setTitleFont: (font: string) => void;
  getFontValue: (fontName: string) => string;
}

const STORAGE_KEY = "rhythmNatorFonts";

const defaultFonts: FontSettings = {
  textFont: "Roboto",
  titleFont: "Outfit",
};

export const FontContext = createContext<FontContextType | undefined>(undefined);

interface FontProviderProps {
  children: ReactNode;
}

// Load Google Fonts dynamically
const loadGoogleFont = (fontName: string) => {
  const font = availableFonts.find(f => f.name === fontName);
  if (!font) return;

  const linkId = `google-font-${fontName.replace(/\s+/g, '-')}`;
  
  // Check if already loaded
  if (document.getElementById(linkId)) return;

  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${font.googleFont}&display=swap`;
  document.head.appendChild(link);
};

export const FontProvider = ({ children }: FontProviderProps) => {
  const [textFont, setTextFontState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as FontSettings;
        return parsed.textFont || defaultFonts.textFont;
      }
    } catch (e) {
      console.error("Error loading font settings:", e);
    }
    return defaultFonts.textFont;
  });

  const [titleFont, setTitleFontState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as FontSettings;
        return parsed.titleFont || defaultFonts.titleFont;
      }
    } catch (e) {
      console.error("Error loading font settings:", e);
    }
    return defaultFonts.titleFont;
  });

  // Get the CSS font-family value for a font name
  const getFontValue = (fontName: string): string => {
    const font = availableFonts.find(f => f.name === fontName);
    return font ? font.value : `'${fontName}', sans-serif`;
  };

  // Save to localStorage
  const saveSettings = (text: string, title: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ textFont: text, titleFont: title }));
    } catch (e) {
      console.error("Error saving font settings:", e);
    }
  };

  const setTextFont = (font: string) => {
    setTextFontState(font);
    saveSettings(font, titleFont);
  };

  const setTitleFont = (font: string) => {
    setTitleFontState(font);
    saveSettings(textFont, font);
  };

  // Apply fonts to CSS variables and load Google Fonts
  useEffect(() => {
    loadGoogleFont(textFont);
    loadGoogleFont(titleFont);

    const root = document.documentElement;
    root.style.setProperty('--font-text', getFontValue(textFont));
    root.style.setProperty('--font-title', getFontValue(titleFont));
  }, [textFont, titleFont]);

  return (
    <FontContext.Provider value={{ textFont, titleFont, setTextFont, setTitleFont, getFontValue }}>
      {children}
    </FontContext.Provider>
  );
};

export const useFont = (): FontContextType => {
  const context = useContext(FontContext);
  if (!context) {
    throw new Error("useFont must be used within a FontProvider");
  }
  return context;
};
