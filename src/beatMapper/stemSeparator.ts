import { frameToTime } from "./audioAnalyzer";
import { BeatInfo, quantizeOnsets } from "./beatDetector";

export type StemType = "drums" | "bass" | "vocals" | "other";

export interface StemData {
  type: StemType;
  label: string;
  color: string;
  filters: FilterConfig[];
  rmsFrames: Float32Array;
  miniWaveform: Float32Array; // 60 normalized values for UI bars
}

export interface FilterConfig {
  type: BiquadFilterType;
  frequency: number;
}

const STEM_CONFIGS: Array<{
  type: StemType;
  label: string;
  color: string;
  filters: FilterConfig[];
}> = [
  {
    type: "drums",
    label: "Batterie",
    color: "#ef4444",
    filters: [
      { type: "highpass", frequency: 80 },
      { type: "lowpass", frequency: 12000 },
    ],
  },
  {
    type: "bass",
    label: "Basse",
    color: "#3b82f6",
    filters: [{ type: "lowpass", frequency: 280 }],
  },
  {
    type: "vocals",
    label: "Voix / Mélodie",
    color: "#22c55e",
    filters: [
      { type: "highpass", frequency: 300 },
      { type: "lowpass", frequency: 4000 },
    ],
  },
  {
    type: "other",
    label: "Autre",
    color: "#f59e0b",
    filters: [{ type: "highpass", frequency: 4000 }],
  },
];

async function renderFiltered(
  audioBuffer: AudioBuffer,
  filters: FilterConfig[]
): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(
    1,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;

  let lastNode: AudioNode = source;
  for (const f of filters) {
    const filter = offlineCtx.createBiquadFilter();
    filter.type = f.type;
    filter.frequency.value = f.frequency;
    lastNode.connect(filter);
    lastNode = filter;
  }
  lastNode.connect(offlineCtx.destination);
  source.start(0);

  return offlineCtx.startRendering();
}

function computeRmsFrames(channelData: Float32Array, hopSize: number): Float32Array {
  const numFrames = Math.floor(channelData.length / hopSize);
  const rms = new Float32Array(numFrames);
  for (let i = 0; i < numFrames; i++) {
    const start = i * hopSize;
    const end = Math.min(start + hopSize, channelData.length);
    let sumSq = 0;
    for (let j = start; j < end; j++) sumSq += channelData[j] * channelData[j];
    rms[i] = Math.sqrt(sumSq / (end - start));
  }
  return rms;
}

function computeMiniWaveform(rmsFrames: Float32Array, points = 60): Float32Array {
  const mini = new Float32Array(points);
  const maxVal = Math.max(...rmsFrames, 0.001);
  const blockSize = rmsFrames.length / points;
  for (let i = 0; i < points; i++) {
    const start = Math.floor(i * blockSize);
    const end = Math.min(Math.ceil((i + 1) * blockSize), rmsFrames.length);
    let peak = 0;
    for (let j = start; j < end; j++) peak = Math.max(peak, rmsFrames[j]);
    mini[i] = peak / maxVal;
  }
  return mini;
}

export async function separateStems(
  audioBuffer: AudioBuffer,
  hopSize: number,
  onProgress?: (pct: number) => void
): Promise<StemData[]> {
  const results: StemData[] = [];

  for (let i = 0; i < STEM_CONFIGS.length; i++) {
    const config = STEM_CONFIGS[i];
    onProgress?.(Math.floor((i / STEM_CONFIGS.length) * 100));

    const filtered = await renderFiltered(audioBuffer, config.filters);
    const channelData = filtered.getChannelData(0);
    const rmsFrames = computeRmsFrames(channelData, hopSize);
    const miniWaveform = computeMiniWaveform(rmsFrames);

    results.push({
      type: config.type,
      label: config.label,
      color: config.color,
      filters: config.filters,
      rmsFrames,
      miniWaveform,
    });

    await new Promise((r) => setTimeout(r, 0));
  }

  onProgress?.(100);
  return results;
}

export function computeOnsetsFromStems(
  activeStems: StemData[],
  hopSize: number,
  sampleRate: number,
  framesPerSecond: number,
  /** If provided, onsets are snapped to the 1/16-note grid (same as quantizeOnsets) */
  bpm?: number,
  phaseOffset?: number
): BeatInfo[] {
  if (activeStems.length === 0) return [];

  const numFrames = activeStems[0].rmsFrames.length;
  const combined = new Float32Array(numFrames);

  // Sum normalized RMS from each active stem
  for (const stem of activeStems) {
    const maxRms = Math.max(...stem.rmsFrames, 0.001);
    for (let i = 0; i < numFrames; i++) {
      combined[i] += stem.rmsFrames[i] / maxRms;
    }
  }

  // Half-wave rectified first difference (flux equivalent on combined signal)
  const flux = new Float32Array(numFrames);
  for (let i = 1; i < numFrames; i++) {
    const diff = combined[i] - combined[i - 1];
    flux[i] = diff > 0 ? diff : 0;
  }

  // Adaptive peak picking
  const onsets: BeatInfo[] = [];
  const windowSize = Math.floor(framesPerSecond * 0.15);
  const DELTA = 0.04;

  for (let i = 1; i < flux.length - 1; i++) {
    const start = Math.max(0, i - windowSize);
    const end = Math.min(flux.length, i + windowSize);
    let localSum = 0;
    for (let j = start; j < end; j++) localSum += flux[j];
    const threshold = localSum / (end - start) + DELTA;
    const isLocalPeak = flux[i] > flux[i - 1] && flux[i] >= flux[i + 1];
    if (isLocalPeak && flux[i] > threshold) {
      onsets.push({
        time: frameToTime(i, hopSize, sampleRate),
        strength: flux[i],
        isBeat: false,
        isOnset: true,
      });
    }
  }

  // Minimum spacing 80ms
  const result: BeatInfo[] = [];
  let lastTime = -Infinity;
  for (const o of onsets) {
    if (o.time - lastTime >= 0.08) {
      result.push(o);
      lastTime = o.time;
    }
  }

  // Apply BPM-based grid quantization if available
  if (bpm && bpm > 0) {
    return quantizeOnsets(result, bpm, phaseOffset ?? 0);
  }
  return result;
}
