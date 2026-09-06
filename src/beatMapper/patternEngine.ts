import { BeatInfo } from "./beatDetector";
import { Section } from "./sectionDetector";

export type PatternStyle = "zigzag" | "mirror" | "stairs" | "circle" | "random";

export interface LaneNote {
  time: number;
  duration: number;
  laneIndex: number;
  strength: number;
  /** 1/16-note grid position, carried through for difficulty filtering */
  subdivisionIndex?: number;
}

interface PatternEngineOptions {
  laneCount: number;
  pattern: PatternStyle;
  allowHolds: boolean;
  minHoldStrength: number;
  /** Place a chord (2 simultaneous notes) on measure downbeats — intended for hard/expert */
  enableChords: boolean;
}

const DEFAULT_OPTIONS: PatternEngineOptions = {
  laneCount: 4,
  pattern: "zigzag",
  allowHolds: true,
  minHoldStrength: 0.7,
  enableChords: false,
};

export function generateNotes(
  onsets: BeatInfo[],
  beats: BeatInfo[],
  sections: Section[],
  options: Partial<PatternEngineOptions> = {}
): LaneNote[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { laneCount, pattern, allowHolds, minHoldStrength, enableChords } = opts;

  const notes: LaneNote[] = [];
  const lastLaneTime: number[] = Array(laneCount).fill(-Infinity);

  const triggers = onsets.length > 10 ? onsets : beats;
  const patternFn = getPatternFn(pattern, laneCount);

  let patternCursor = 0;
  let lastMeasure = -1;

  for (let i = 0; i < triggers.length; i++) {
    const onset = triggers[i];
    const MIN_LANE_GAP = 0.08;

    // Reset pattern cursor at each measure boundary (every 16 subdivisions = 4 beats)
    if (onset.subdivisionIndex !== undefined) {
      const measure = Math.floor(onset.subdivisionIndex / 16);
      if (measure > lastMeasure) {
        patternCursor = 0;
        lastMeasure = measure;
      }
    }

    // Determine lane via pattern
    let attempts = 0;
    let lane = patternFn(patternCursor, i, laneCount);
    while (onset.time - lastLaneTime[lane] < MIN_LANE_GAP && attempts < laneCount) {
      patternCursor++;
      lane = patternFn(patternCursor, i, laneCount);
      attempts++;
    }
    if (attempts >= laneCount) continue;

    // Hold duration — snap end to the next subdivision boundary
    let holdDuration = 0;
    if (allowHolds && onset.strength > minHoldStrength) {
      const next = triggers[i + 1];
      if (next) {
        const gap = next.time - onset.time;
        if (gap > 0.3 && gap < 2.0) {
          holdDuration = parseFloat((gap * 0.8).toFixed(3));
        }
      }
    }

    notes.push({
      time: onset.time,
      duration: holdDuration,
      laneIndex: lane,
      strength: onset.strength,
      subdivisionIndex: onset.subdivisionIndex,
    });
    lastLaneTime[lane] = onset.time;
    patternCursor++;

    // Chord on measure downbeats (subdivisionIndex % 16 === 0)
    if (
      enableChords &&
      laneCount >= 2 &&
      onset.subdivisionIndex !== undefined &&
      onset.subdivisionIndex % 16 === 0
    ) {
      const chordLane = (lane + Math.ceil(laneCount / 2)) % laneCount;
      if (chordLane !== lane && onset.time - lastLaneTime[chordLane] >= MIN_LANE_GAP) {
        notes.push({
          time: onset.time,
          duration: holdDuration,
          laneIndex: chordLane,
          strength: onset.strength,
          subdivisionIndex: onset.subdivisionIndex,
        });
        lastLaneTime[chordLane] = onset.time;
      }
    }
  }

  return notes;
}

function getPatternFn(
  style: PatternStyle,
  laneCount: number
): (cursor: number, noteIndex: number, lanes: number) => number {
  switch (style) {
    case "zigzag":
      return (cursor) => {
        const cycle = cursor % (laneCount * 2 - 2);
        if (cycle < laneCount) return cycle;
        return laneCount * 2 - 2 - cycle;
      };

    case "mirror":
      return (cursor) => {
        const half = Math.floor(laneCount / 2);
        const pos  = cursor % (half * 2);
        return pos < half ? pos : laneCount - 1 - pos + half;
      };

    case "stairs":
      return (cursor) => cursor % laneCount;

    case "circle":
      return (cursor) => {
        const order = [0, 1, 3, 2];
        return order[cursor % order.length] % laneCount;
      };

    case "random":
      return (_cursor, noteIndex) => ((noteIndex * 2654435761) >>> 0) % laneCount;

    default:
      return (cursor) => cursor % laneCount;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getSectionAt(time: number, sections: Section[]): Section | null {
  return sections.find((s) => time >= s.startTime && time < s.endTime) ?? null;
}
