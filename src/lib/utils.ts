import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Calculate luminance of a hex color to determine if text should be light or dark
export function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance (YIQ formula)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // If color is light (luminance > 128), use dark text, else light text
  return brightness > 128 ? '#000000' : '#FFFFFF';
}
