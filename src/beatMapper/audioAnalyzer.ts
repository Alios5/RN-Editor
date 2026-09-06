export interface AudioAnalysisResult {
  audioBuffer: AudioBuffer;
  duration: number;
  sampleRate: number;
  rmsFrames: Float32Array;
  spectralFluxFrames: Float32Array;
  frameSize: number;
  hopSize: number;
  framesPerSecond: number;
}

// Larger hop = fewer frames = much faster analysis (86ms resolution at 44100Hz)
const FRAME_SIZE = 2048;
const HOP_SIZE = 2048;

export async function analyzeAudio(
  file: File,
  onProgress?: (pct: number) => void
): Promise<AudioAnalysisResult> {
  onProgress?.(5);

  const arrayBuffer = await file.arrayBuffer();
  onProgress?.(15);

  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  onProgress?.(35);

  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const totalSamples = channelData.length;
  const numFrames = Math.floor(totalSamples / HOP_SIZE);

  const rmsFrames = new Float32Array(numFrames);
  const spectralFluxFrames = new Float32Array(numFrames);

  // Pre-allocate reusable buffers
  const re = new Float64Array(FRAME_SIZE);
  const im = new Float64Array(FRAME_SIZE);
  let prevMagnitudes: Float32Array | null = null;

  for (let i = 0; i < numFrames; i++) {
    const start = i * HOP_SIZE;

    // RMS energy — direct access, no slice
    let sumSq = 0;
    const end = Math.min(start + FRAME_SIZE, totalSamples);
    for (let j = start; j < end; j++) sumSq += channelData[j] * channelData[j];
    rmsFrames[i] = Math.sqrt(sumSq / (end - start));

    // Fill FFT input buffers with Hann window
    for (let j = 0; j < FRAME_SIZE; j++) {
      const sample = start + j < totalSamples ? channelData[start + j] : 0;
      const hann = 0.5 * (1 - Math.cos((2 * Math.PI * j) / (FRAME_SIZE - 1)));
      re[j] = sample * hann;
      im[j] = 0;
    }

    // In-place Cooley-Tukey FFT O(N log N)
    fft(re, im, FRAME_SIZE);

    // Spectral flux: sum of positive magnitude differences
    const half = FRAME_SIZE >> 1;
    const magnitudes = new Float32Array(half);
    for (let j = 0; j < half; j++) {
      magnitudes[j] = Math.sqrt(re[j] * re[j] + im[j] * im[j]);
    }

    if (prevMagnitudes) {
      let flux = 0;
      for (let j = 0; j < half; j++) {
        const diff = magnitudes[j] - prevMagnitudes[j];
        if (diff > 0) flux += diff;
      }
      spectralFluxFrames[i] = flux;
    }
    prevMagnitudes = magnitudes;

    // Yield to UI every 200 frames to avoid blocking
    if (i % 200 === 0) {
      onProgress?.(35 + Math.floor((i / numFrames) * 40));
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  onProgress?.(75);
  await audioContext.close();

  const framesPerSecond = sampleRate / HOP_SIZE;

  return {
    audioBuffer,
    duration: audioBuffer.duration,
    sampleRate,
    rmsFrames,
    spectralFluxFrames,
    frameSize: FRAME_SIZE,
    hopSize: HOP_SIZE,
    framesPerSecond,
  };
}

/**
 * In-place Cooley-Tukey FFT — O(N log N), N must be a power of 2.
 */
function fft(re: Float64Array, im: Float64Array, n: number): void {
  // Bit-reversal permutation
  let j = 0;
  for (let i = 1; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }

  // Butterfly passes
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang);
    const wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      for (let k = 0; k < len >> 1; k++) {
        const uRe = re[i + k];
        const uIm = im[i + k];
        const vRe = re[i + k + (len >> 1)] * curRe - im[i + k + (len >> 1)] * curIm;
        const vIm = re[i + k + (len >> 1)] * curIm + im[i + k + (len >> 1)] * curRe;
        re[i + k] = uRe + vRe;
        im[i + k] = uIm + vIm;
        re[i + k + (len >> 1)] = uRe - vRe;
        im[i + k + (len >> 1)] = uIm - vIm;
        const nextRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nextRe;
      }
    }
  }
}

export function frameToTime(frameIndex: number, hopSize: number, sampleRate: number): number {
  return (frameIndex * hopSize) / sampleRate;
}

export function timeToFrame(timeInSeconds: number, hopSize: number, sampleRate: number): number {
  return Math.round((timeInSeconds * sampleRate) / hopSize);
}
