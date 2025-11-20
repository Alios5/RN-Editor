export interface AudioCalculations {
  totalBeats: number;
  totalMeasures: number;
  totalTime: number;
  waveformWidth: number;
}

export const calculateAudioMetrics = (
  bpm: number,
  durationInSeconds: number,
  syncMeasure: number,
  subSyncMeasure: number
): AudioCalculations => {
  const CELL_WIDTH = 24; // pixels
  
  // Calculate total number of beats
  const totalBeats = (bpm * durationInSeconds) / 60;
  
  // Calculate total number of measures
  const totalMeasures = totalBeats / syncMeasure;
  
  // Calculate total number of subdivisions (cells) - exact BPM-based
  const totalSubdivisions = totalBeats * subSyncMeasure;
  
  // Use totalSubdivisions as totalTime for compatibility
  const totalTime = totalSubdivisions;
  
  // Calculate waveform width as exact multiple of cell width
  // This ensures perfect alignment: waveformWidth = number of subdivisions * cellWidth
  const waveformWidth = totalSubdivisions * CELL_WIDTH;
  
  return {
    totalBeats,
    totalMeasures,
    totalTime,
    waveformWidth
  };
};
