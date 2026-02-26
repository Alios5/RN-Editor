import { createContext, useState, useEffect, ReactNode } from "react";
import enTranslations from "@/locales/en.json";
import frTranslations from "@/locales/fr.json";

// Translation types
type Translations = typeof enTranslations;
type Language = "en" | "fr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  translations: Translations;
  t: (key: string, params?: Record<string, string>) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Map of available translations
const translationsMap: Record<Language, Translations> = {
  en: enTranslations,
  fr: frTranslations,
};

// List of available languages with their names
export const availableLanguages = [
  { code: "en" as Language, name: "English", flag: "🇬🇧" },
  { code: "fr" as Language, name: "Français", flag: "🇫🇷" },
];

interface LanguageProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = "rhythmNatorLanguage";

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  // Load language from localStorage or use English by default
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as Language) || "en";
  });

  const [translations, setTranslations] = useState<Translations>(translationsMap[language]);

  // Save and change the language
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    setTranslations(translationsMap[lang]);
  };

  // Translation function with parameter support
  const t = (key: string, params?: Record<string, string>): string => {
    const keys = key.split(".");
    let value: any = translations;

    // Navigate in the translation object
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        // If key doesn't exist, return the raw key
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    // If final value is not a string, return the key
    if (typeof value !== "string") {
      console.warn(`Translation key is not a string: ${key}`);
      return key;
    }

    // Replace parameters in the translation
    if (params) {
      return value.replace(/{(\w+)}/g, (match, paramKey) => {
        return params[paramKey] || match;
      });
    }

    return value;
  };

  useEffect(() => {
    setTranslations(translationsMap[language]);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
