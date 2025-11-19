import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Calculer la luminosité d'une couleur hexadécimale pour déterminer si le texte doit être clair ou foncé
export function getContrastColor(hexColor: string): string {
  // Retirer le # si présent
  const hex = hexColor.replace('#', '');
  
  // Convertir en RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculer la luminosité relative (formule YIQ)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Si la couleur est claire (luminosité > 128), utiliser du texte foncé, sinon texte clair
  return brightness > 128 ? '#000000' : '#FFFFFF';
}
