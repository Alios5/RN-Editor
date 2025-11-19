import { createContext, useState, useEffect, ReactNode } from "react";
import enTranslations from "@/locales/en.json";
import frTranslations from "@/locales/fr.json";

// Types pour les traductions
type Translations = typeof enTranslations;
type Language = "en" | "fr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  translations: Translations;
  t: (key: string, params?: Record<string, string>) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Map des traductions disponibles
const translationsMap: Record<Language, Translations> = {
  en: enTranslations,
  fr: frTranslations,
};

// Liste des langues disponibles avec leurs noms
export const availableLanguages = [
  { code: "en" as Language, name: "English", flag: "🇬🇧" },
  { code: "fr" as Language, name: "Français", flag: "🇫🇷" },
];

interface LanguageProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = "rhythmNatorLanguage";

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  // Charger la langue depuis localStorage ou utiliser l'anglais par défaut
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as Language) || "en";
  });

  const [translations, setTranslations] = useState<Translations>(translationsMap[language]);

  // Sauvegarder et changer la langue
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    setTranslations(translationsMap[lang]);
  };

  // Fonction de traduction avec support des paramètres
  const t = (key: string, params?: Record<string, string>): string => {
    const keys = key.split(".");
    let value: any = translations;

    // Naviguer dans l'objet de traduction
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        // Si la clé n'existe pas, retourner la clé brute
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    // Si la valeur finale n'est pas une string, retourner la clé
    if (typeof value !== "string") {
      console.warn(`Translation key is not a string: ${key}`);
      return key;
    }

    // Remplacer les paramètres dans la traduction
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
