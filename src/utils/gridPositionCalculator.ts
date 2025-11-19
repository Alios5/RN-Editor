/**
 * Calcul précis de la position dans la grille basé sur le BPM
 * Évite les erreurs d'accumulation sur de longues durées
 */

const CELL_WIDTH = 24; // pixels

/**
 * Calcule la position en pixels à partir du temps en secondes
 * Utilise le BPM pour un calcul précis sans dérive
 */
export const timeToPixelPosition = (
  timeInSeconds: number,
  bpm: number,
  subRhythmSync: number
): number => {
  // Calculer le nombre de beats écoulés
  const beatsElapsed = (bpm * timeInSeconds) / 60;
  
  // Calculer le nombre de cellules (chaque beat contient subRhythmSync cellules)
  const cellsElapsed = beatsElapsed * subRhythmSync;
  
  // Convertir en pixels
  return cellsElapsed * CELL_WIDTH;
};

/**
 * Calcule le temps en secondes à partir de la position en pixels
 */
export const pixelPositionToTime = (
  positionInPixels: number,
  bpm: number,
  subRhythmSync: number
): number => {
  // Convertir les pixels en cellules
  const cells = positionInPixels / CELL_WIDTH;
  
  // Convertir les cellules en beats
  const beats = cells / subRhythmSync;
  
  // Convertir les beats en secondes
  return (beats * 60) / bpm;
};

/**
 * Calcule la largeur totale de la forme d'onde en pixels
 */
export const calculateWaveformWidth = (
  audioDuration: number,
  bpm: number,
  subRhythmSync: number
): number => {
  return timeToPixelPosition(audioDuration, bpm, subRhythmSync);
};

/**
 * Calcule la position de la grille (cellule) à partir du temps
 */
export const timeToGridPosition = (
  timeInSeconds: number,
  bpm: number,
  subRhythmSync: number
): number => {
  const beatsElapsed = (bpm * timeInSeconds) / 60;
  return Math.floor(beatsElapsed * subRhythmSync);
};

/**
 * Calcule le temps à partir de la position de la grille (cellule)
 */
export const gridPositionToTime = (
  gridPosition: number,
  bpm: number,
  subRhythmSync: number
): number => {
  const beats = gridPosition / subRhythmSync;
  return (beats * 60) / bpm;
};
