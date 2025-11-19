import { calculateWaveformWidth, timeToGridPosition } from './gridPositionCalculator';

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
  
  // Calculate total number of times (cells) using precise BPM calculation
  const totalTime = timeToGridPosition(durationInSeconds, bpm, subSyncMeasure);
  
  // Calculate waveform width using precise BPM-based calculation (no drift)
  const waveformWidth = calculateWaveformWidth(durationInSeconds, bpm, subSyncMeasure);
  
  return {
    totalBeats,
    totalMeasures,
    totalTime,
    waveformWidth
  };
};
