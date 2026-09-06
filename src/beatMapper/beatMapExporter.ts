import { LaneNote } from "./patternEngine";
import { AIImportData, AIImportNote } from "@/types/aiImport";
import { Track } from "@/types/track";

export interface LaneMapping {
  laneIndex: number;
  trackName: string;
}

export interface ExportOptions {
  bpm: number;
  rhythmSync: number;
  subRhythmSync: number;
  laneMapping: LaneMapping[];
}

export function exportBeatMap(
  notes: LaneNote[],
  options: ExportOptions,
  existingTracks: Track[]
): AIImportData {
  const { bpm, rhythmSync, subRhythmSync, laneMapping } = options;

  const laneToTrack = new Map<number, string>();
  for (const mapping of laneMapping) {
    laneToTrack.set(mapping.laneIndex, mapping.trackName);
  }

  const addNotes: AIImportNote[] = [];
  const tracksToCreate = new Set<string>();
  const existingTrackNames = new Set(existingTracks.map((t) => t.name));

  for (const note of notes) {
    const trackName = laneToTrack.get(note.laneIndex);
    if (!trackName) continue;

    if (!existingTrackNames.has(trackName)) {
      tracksToCreate.add(trackName);
    }

    addNotes.push({
      trackName,
      startTime: parseFloat(note.time.toFixed(3)),
      duration: note.duration > 0 ? parseFloat(note.duration.toFixed(3)) : 0,
    });
  }

  const result: AIImportData = {
    addNotes,
    updateSettings: {
      bpm,
      rhythmSync,
      subRhythmSync,
    },
  };

  if (tracksToCreate.size > 0) {
    const LANE_COLORS = ["#eab308", "#ef4444", "#22c55e", "#3b82f6"];
    result.addTracks = Array.from(tracksToCreate).map((name, i) => ({
      name,
      color: LANE_COLORS[i % LANE_COLORS.length],
    }));
  }

  return result;
}

export function groupNotesByLane(
  notes: LaneNote[],
  laneMapping: LaneMapping[]
): Record<string, LaneNote[]> {
  const result: Record<string, LaneNote[]> = {};
  const laneToTrack = new Map<number, string>();
  for (const m of laneMapping) laneToTrack.set(m.laneIndex, m.trackName);

  for (const note of notes) {
    const name = laneToTrack.get(note.laneIndex);
    if (!name) continue;
    if (!result[name]) result[name] = [];
    result[name].push(note);
  }

  return result;
}
