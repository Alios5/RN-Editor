/**
 * Calcul précis de la position dans la grille basé sur le BPM
 * Évite les erreurs d'accumulation sur de longues durées
 */

/**
 * Calcule le nombre de cellules (subdivisions) à partir du temps en secondes
 * Utilise le BPM pour un calcul précis sans dérive
 */
export const timeToCellPosition = (
  timeInSeconds: number,
  bpm: number,
  subRhythmSync: number
): number => {
  // Calculer le nombre de beats écoulés
  const beatsElapsed = (bpm * timeInSeconds) / 60;
  
  // Calculer le nombre de cellules (chaque beat contient subRhythmSync cellules)
  return beatsElapsed * subRhythmSync;
};

/**
 * Calcule la position en pixels à partir du temps en secondes
 * cellWidth doit être fourni pour la conversion pixels
 */
export const timeToPixelPosition = (
  timeInSeconds: number,
  bpm: number,
  subRhythmSync: number,
  cellWidth: number = 24
): number => {
  const cellsElapsed = timeToCellPosition(timeInSeconds, bpm, subRhythmSync);
  return cellsElapsed * cellWidth;
};

/**
 * Calcule le temps en secondes à partir de la position en pixels
 * cellWidth doit être fourni pour la conversion pixels
 */
export const pixelPositionToTime = (
  positionInPixels: number,
  bpm: number,
  subRhythmSync: number,
  cellWidth: number = 24
): number => {
  // Convertir les pixels en cellules
  const cells = positionInPixels / cellWidth;
  
  // Convertir les cellules en beats
  const beats = cells / subRhythmSync;
  
  // Convertir les beats en secondes
  return (beats * 60) / bpm;
};

/**
 * Calcule la largeur totale de la forme d'onde en pixels
 * cellWidth doit être fourni pour la conversion pixels (par défaut 24)
 */
export const calculateWaveformWidth = (
  audioDuration: number,
  bpm: number,
  subRhythmSync: number,
  cellWidth: number = 24
): number => {
  return timeToPixelPosition(audioDuration, bpm, subRhythmSync, cellWidth);
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
