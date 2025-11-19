import { useContext } from "react";
import { LanguageContext } from "@/contexts/LanguageContext";

/**
 * Hook pour accéder aux fonctionnalités de traduction
 * @returns {object} Objet contenant la langue actuelle, la fonction pour changer de langue et la fonction de traduction
 * @example
 * const { t, language, setLanguage } = useTranslation();
 * const title = t("project.title");
 * const welcomeMsg = t("project.createSuccess", { name: "Mon Projet" });
 */
export const useTranslation = () => {
  const context = useContext(LanguageContext);
  
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  
  return context;
};
