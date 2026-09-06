import { LaneNote } from "./patternEngine";

export type Difficulty = "easy" | "normal" | "hard" | "expert";

interface DifficultyConfig {
  noteRetentionRate: number;
  maxNotesPerSecond: number;
  allowHolds: boolean;
  minNoteSpacingMs: number;
}

const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy:   { noteRetentionRate: 0.3,  maxNotesPerSecond: 2,  allowHolds: false, minNoteSpacingMs: 500 },
  normal: { noteRetentionRate: 0.55, maxNotesPerSecond: 4,  allowHolds: true,  minNoteSpacingMs: 250 },
  hard:   { noteRetentionRate: 0.75, maxNotesPerSecond: 6,  allowHolds: true,  minNoteSpacingMs: 150 },
  expert: { noteRetentionRate: 1.0,  maxNotesPerSecond: 10, allowHolds: true,  minNoteSpacingMs: 80  },
};

/**
 * Musical importance multiplier based on position in the 1/16-note grid.
 * Inspired by BeatLearning's beat-aligned tokenisation where tokens on stronger
 * metrical positions carry more structural weight.
 *
 *   % 16 === 0  → measure downbeat   (×4.0)
 *   % 8  === 0  → half-measure beat  (×3.0)
 *   % 4  === 0  → quarter note beat  (×2.0)
 *   % 2  === 0  → eighth note        (×1.4)
 *   else        → sixteenth note     (×1.0)
 */
function subdivisionPriority(subdivisionIndex?: number): number {
  if (subdivisionIndex === undefined) return 1.0;
  if (subdivisionIndex % 16 === 0) return 4.0;
  if (subdivisionIndex % 8  === 0) return 3.0;
  if (subdivisionIndex % 4  === 0) return 2.0;
  if (subdivisionIndex % 2  === 0) return 1.4;
  return 1.0;
}

export function filterByDifficulty(notes: LaneNote[], difficulty: Difficulty): LaneNote[] {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const sorted = [...notes].sort((a, b) => a.time - b.time);

  // Score = raw onset strength × metrical importance
  const targetCount = Math.ceil(sorted.length * config.noteRetentionRate);
  const byScore = [...sorted].sort(
    (a, b) => b.strength * subdivisionPriority(b.subdivisionIndex)
            - a.strength * subdivisionPriority(a.subdivisionIndex)
  );
  const kept = new Set(byScore.slice(0, targetCount).map((n) => n.time));

  let filtered = sorted.filter((n) => kept.has(n.time));

  if (!config.allowHolds) {
    filtered = filtered.map((n) => ({ ...n, duration: 0 }));
  }

  // Enforce min spacing per lane
  const lastTimeByLane: number[] = [];
  const result: LaneNote[] = [];
  for (const note of filtered) {
    const last  = lastTimeByLane[note.laneIndex] ?? -Infinity;
    const gapMs = (note.time - last) * 1000;
    if (gapMs >= config.minNoteSpacingMs) {
      result.push(note);
      lastTimeByLane[note.laneIndex] = note.time;
    }
  }

  return result;
}

export function estimateNoteCount(
  totalOnsets: number,
  difficulty: Difficulty
): number {
  return Math.ceil(totalOnsets * DIFFICULTY_CONFIGS[difficulty].noteRetentionRate);
}
