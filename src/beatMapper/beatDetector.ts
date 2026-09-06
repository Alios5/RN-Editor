import { AudioAnalysisResult } from "./audioAnalyzer";

export interface BeatInfo {
  time: number;
  strength: number;
  isBeat: boolean;
  isOnset: boolean;
  /** Position in the 1/16-note grid (0 = beat 1 of measure 1, 4 = beat 2, 16 = measure 2, …) */
  subdivisionIndex?: number;
}

export interface BeatDetectionResult {
  bpm: number;
  beats: BeatInfo[];
  /** Raw onsets (parabolic-interpolated, not yet snapped to grid) */
  onsets: BeatInfo[];
  /** Onsets quantized to the nearest 1/16-note subdivision */
  quantizedOnsets: BeatInfo[];
  beatInterval: number;
  /** Phase offset in seconds: where beat 1 actually falls (0 ≤ offset < beatInterval) */
  beatPhaseOffset: number;
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function detectBeats(
  analysis: AudioAnalysisResult,
  bpmOverride?: number,
  onProgress?: (pct: number) => void
): Promise<BeatDetectionResult> {
  onProgress?.(0);

  const { audioBuffer, rmsFrames, spectralFluxFrames, hopSize, sampleRate, framesPerSecond } = analysis;

  // BPM
  let bpm = bpmOverride ?? 0;
  if (!bpm || bpm < 30) bpm = await estimateBPMFromBuffer(audioBuffer);
  onProgress?.(30);

  const beatInterval = 60 / bpm;

  // Phase alignment: find where beat 1 actually falls
  const beatPhaseOffset = estimateBeatPhase(spectralFluxFrames, hopSize, sampleRate, beatInterval);
  onProgress?.(45);

  // Onset detection with parabolic sub-frame refinement
  const rawOnsets = detectOnsetsFromFlux(spectralFluxFrames, hopSize, sampleRate, framesPerSecond);
  onProgress?.(65);

  // Snap onsets to nearest 1/16th-note position
  const quantizedOnsets = quantizeOnsets(rawOnsets, bpm, beatPhaseOffset);

  // Beat grid aligned to phase
  const beats = buildBeatGrid(bpm, analysis.duration, rmsFrames, hopSize, sampleRate, beatPhaseOffset);
  onProgress?.(100);

  return { bpm, beats, onsets: rawOnsets, quantizedOnsets, beatInterval, beatPhaseOffset };
}

// ─── Phase alignment ──────────────────────────────────────────────────────────

/**
 * Scores 32 evenly-spaced phase offsets within one beat and returns the one
 * that maximises total spectral flux at beat positions (inspired by BeatLearning's
 * beat-aligned tokenisation).
 */
function estimateBeatPhase(
  flux: Float32Array,
  hopSize: number,
  sampleRate: number,
  beatInterval: number
): number {
  const NUM_PHASES = 32;
  let bestPhase = 0;
  let bestScore = -Infinity;
  const duration = (flux.length * hopSize) / sampleRate;

  for (let p = 0; p < NUM_PHASES; p++) {
    const offset = (p / NUM_PHASES) * beatInterval;
    let score = 0;
    for (let t = offset; t < duration; t += beatInterval) {
      const frame = Math.round((t * sampleRate) / hopSize);
      if (frame >= 0 && frame < flux.length) score += flux[frame];
    }
    if (score > bestScore) { bestScore = score; bestPhase = offset; }
  }

  return bestPhase;
}

// ─── Onset detection with sub-frame precision ─────────────────────────────────

function detectOnsetsFromFlux(
  flux: Float32Array,
  hopSize: number,
  sampleRate: number,
  framesPerSecond: number
): BeatInfo[] {
  const onsets: BeatInfo[] = [];
  const windowSize = Math.floor(framesPerSecond * 0.1); // 100 ms local window
  const DELTA = 0.07;

  for (let i = 1; i < flux.length - 1; i++) {
    const start = Math.max(0, i - windowSize);
    const end   = Math.min(flux.length, i + windowSize);
    let localSum = 0;
    for (let j = start; j < end; j++) localSum += flux[j];
    const threshold = localSum / (end - start) + DELTA;
    const isPeak = flux[i] > flux[i - 1] && flux[i] >= flux[i + 1];

    if (isPeak && flux[i] > threshold) {
      // Parabolic interpolation for sub-frame accuracy (±46 ms → ±2 ms)
      const denom = flux[i - 1] - 2 * flux[i] + flux[i + 1];
      const corr  = denom !== 0 ? 0.5 * (flux[i - 1] - flux[i + 1]) / denom : 0;
      const refinedFrame = i + corr;
      const time = parseFloat(((refinedFrame * hopSize) / sampleRate).toFixed(4));
      onsets.push({ time, strength: flux[i], isBeat: false, isOnset: true });
    }
  }

  return filterMinSpacing(onsets, 0.08);
}

// ─── Grid quantisation ────────────────────────────────────────────────────────

/**
 * Snaps every onset to the nearest 1/16-note subdivision of the beat grid.
 * When multiple onsets collapse to the same slot, the strongest one wins.
 *
 * Exported so stem-based onsets can also be quantized.
 *
 * `subdivisionIndex` encoding (1/16-note units, 0-indexed from phase offset):
 *   % 4 === 0  → quarter note (beat)
 *   % 8 === 0  → half-note (beats 1 & 3)
 *   % 16 === 0 → measure downbeat
 */
export function quantizeOnsets(
  onsets: BeatInfo[],
  bpm: number,
  phaseOffset: number
): BeatInfo[] {
  const subInterval = 60 / bpm / 4; // 1/16-note duration in seconds
  const grid = new Map<number, BeatInfo>(); // slotIndex → strongest onset

  for (const onset of onsets) {
    const adjusted = onset.time - phaseOffset;
    const slotIdx  = Math.round(adjusted / subInterval);
    const slotTime = Math.max(0, parseFloat((phaseOffset + slotIdx * subInterval).toFixed(4)));
    const existing = grid.get(slotIdx);
    if (!existing || onset.strength > existing.strength) {
      grid.set(slotIdx, { ...onset, time: slotTime, subdivisionIndex: slotIdx });
    }
  }

  return Array.from(grid.values()).sort((a, b) => a.time - b.time);
}

// ─── Beat grid ────────────────────────────────────────────────────────────────

function buildBeatGrid(
  bpm: number,
  duration: number,
  rmsFrames: Float32Array,
  hopSize: number,
  sampleRate: number,
  phaseOffset: number
): BeatInfo[] {
  const beatInterval = 60 / bpm;
  const beats: BeatInfo[] = [];
  let beatNum = 0;

  for (let t = phaseOffset; t < duration; t += beatInterval) {
    const frame = Math.round((t * sampleRate) / hopSize);
    const strength = frame < rmsFrames.length ? rmsFrames[frame] : 0;
    beats.push({
      time: parseFloat(t.toFixed(4)),
      strength,
      isBeat: true,
      isOnset: false,
      subdivisionIndex: beatNum * 4, // each beat = 4 subdivision slots
    });
    beatNum++;
  }

  return beats;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function estimateBPMFromBuffer(audioBuffer: AudioBuffer): Promise<number> {
  try {
    const { analyzeFullBuffer } = await import("realtime-bpm-analyzer");
    const candidates = await analyzeFullBuffer(audioBuffer);
    if (candidates?.length) return Math.round(candidates[0].tempo * 100) / 100;
  } catch { /* fallback */ }
  return 120;
}

function filterMinSpacing(items: BeatInfo[], minGapSeconds: number): BeatInfo[] {
  const filtered: BeatInfo[] = [];
  let lastTime = -Infinity;
  for (const item of items) {
    if (item.time - lastTime >= minGapSeconds) {
      filtered.push(item);
      lastTime = item.time;
    }
  }
  return filtered;
}
