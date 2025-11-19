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
  // Calculate total number of beats
  const totalBeats = (bpm * durationInSeconds) / 60;
  
  // Calculate total number of measures
  const totalMeasures = totalBeats / syncMeasure;
  
  // Calculate total number of times
  const totalTime = totalBeats * subSyncMeasure;
  
  // Calculate waveform width (24px per cell/time)
  const waveformWidth = totalTime * 24;
  
  return {
    totalBeats,
    totalMeasures,
    totalTime,
    waveformWidth
  };
};
