import { AudioAnalysisResult, frameToTime } from "./audioAnalyzer";

export type SectionType = "intro" | "verse" | "chorus" | "drop" | "bridge" | "outro";

export interface Section {
  type: SectionType;
  label: string;
  startTime: number;
  endTime: number;
  avgEnergy: number;
  color: string;
}

const SECTION_COLORS: Record<SectionType, string> = {
  intro: "#6366f1",
  verse: "#3b82f6",
  chorus: "#ec4899",
  drop: "#ef4444",
  bridge: "#f97316",
  outro: "#8b5cf6",
};

const SECTION_LABELS: Record<SectionType, string> = {
  intro: "Intro",
  verse: "Verse",
  chorus: "Chorus",
  drop: "Drop",
  bridge: "Bridge",
  outro: "Outro",
};

export function detectSections(
  analysis: AudioAnalysisResult,
  bpm: number
): Section[] {
  const { rmsFrames, hopSize, sampleRate, duration } = analysis;

  // Block size: 4 beats = 1 measure
  const beatsPerMeasure = 4;
  const beatDuration = 60 / bpm;
  const measureDuration = beatDuration * beatsPerMeasure;
  const framesPerMeasure = Math.floor((measureDuration * sampleRate) / hopSize);

  const numMeasures = Math.floor(rmsFrames.length / framesPerMeasure);

  // Compute average energy per measure
  const measureEnergies: number[] = [];
  for (let m = 0; m < numMeasures; m++) {
    const start = m * framesPerMeasure;
    const end = Math.min(start + framesPerMeasure, rmsFrames.length);
    let sum = 0;
    for (let i = start; i < end; i++) sum += rmsFrames[i];
    measureEnergies.push(sum / (end - start));
  }

  // Normalize energies 0..1
  const maxEnergy = Math.max(...measureEnergies, 0.0001);
  const normEnergies = measureEnergies.map((e) => e / maxEnergy);

  // Assign section types based on relative energy thresholds
  const rawSections: { measureIndex: number; type: SectionType }[] = normEnergies.map(
    (e, i) => ({
      measureIndex: i,
      type: classifyMeasure(e, i, numMeasures),
    })
  );

  // Merge consecutive measures of same type
  const merged: Section[] = [];
  let current = rawSections[0];
  let startMeasure = 0;

  for (let i = 1; i <= rawSections.length; i++) {
    const isDifferent = i === rawSections.length || rawSections[i].type !== current?.type;
    if (isDifferent && current) {
      const startTime = startMeasure * measureDuration;
      const endTime = Math.min(i * measureDuration, duration);
      const avgEnergy =
        normEnergies.slice(startMeasure, i).reduce((a, b) => a + b, 0) /
        (i - startMeasure);

      merged.push({
        type: current.type,
        label: SECTION_LABELS[current.type],
        startTime: parseFloat(startTime.toFixed(3)),
        endTime: parseFloat(endTime.toFixed(3)),
        avgEnergy,
        color: SECTION_COLORS[current.type],
      });

      if (i < rawSections.length) {
        current = rawSections[i];
        startMeasure = i;
      }
    }
  }

  // Enforce: first section = intro, last = outro
  if (merged.length > 0) {
    merged[0].type = "intro";
    merged[0].label = SECTION_LABELS["intro"];
    merged[0].color = SECTION_COLORS["intro"];
  }
  if (merged.length > 1) {
    merged[merged.length - 1].type = "outro";
    merged[merged.length - 1].label = SECTION_LABELS["outro"];
    merged[merged.length - 1].color = SECTION_COLORS["outro"];
  }

  return merged;
}

function classifyMeasure(
  normalizedEnergy: number,
  measureIndex: number,
  totalMeasures: number
): SectionType {
  const positionRatio = measureIndex / totalMeasures;

  if (positionRatio < 0.1) return "intro";
  if (positionRatio > 0.9) return "outro";

  if (normalizedEnergy > 0.85) return "drop";
  if (normalizedEnergy > 0.65) return "chorus";
  if (normalizedEnergy > 0.35) return "verse";
  return "bridge";
}
