import { AIImportData } from "@/types/aiImport";
import { Track } from "@/types/track";
import { TrackGroup } from "@/types/trackGroup";
import { Note } from "@/types/note";
import { SpecificAction } from "@/types/specificAction";
import { generateId } from "@/utils/uuid";
import { timeToCellPosition } from "@/utils/gridPositionCalculator";

export interface ApplyAIImportResult {
  tracks: Track[];
  trackGroups: TrackGroup[];
  bpm?: number;
  rhythmSync?: number;
  subRhythmSync?: number;
  volume?: number;
  pitch?: number;
  startOffset?: number;
}

const TRACK_PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#06b6d4",
];

export function applyAIImport(
  data: AIImportData,
  currentTracks: Track[],
  currentTrackGroups: TrackGroup[],
  currentSpecificActions: SpecificAction[],
  bpm: number,
  subRhythmSync: number,
  startOffset: number
): ApplyAIImportResult {
  let tracks = [...currentTracks];
  let trackGroups = [...currentTrackGroups];

  // 1. Create new tracks
  if (data.addTracks && data.addTracks.length > 0) {
    for (const trackDef of data.addTracks) {
      const alreadyExists = tracks.find(
        (t) => t.name.toLowerCase() === trackDef.name.toLowerCase()
      );
      if (alreadyExists) continue;

      // Resolve group
      let groupId: string | undefined = undefined;
      if (trackDef.groupName) {
        let group = trackGroups.find(
          (g) => g.name.toLowerCase() === trackDef.groupName!.toLowerCase()
        );
        if (!group) {
          group = {
            id: generateId(),
            name: trackDef.groupName,
            visible: true,
            collapsed: false,
          };
          trackGroups = [...trackGroups, group];
        }
        groupId = group.id;
      }

      const color =
        trackDef.color ||
        TRACK_PRESET_COLORS[tracks.length % TRACK_PRESET_COLORS.length];

      const newTrack: Track = {
        id: generateId(),
        name: trackDef.name,
        color,
        visible: true,
        order: tracks.length,
        createdAt: new Date().toISOString(),
        notes: [],
        groupId,
      };
      tracks = [...tracks, newTrack];
    }
  }

  // 2. Add notes to tracks
  if (data.addNotes && data.addNotes.length > 0) {
    const cellWidth = 24;
    const offsetInCells = startOffset / cellWidth;

    tracks = tracks.map((track) => {
      const notesForTrack = data.addNotes!.filter(
        (n) => n.trackName.toLowerCase() === track.name.toLowerCase()
      );

      if (notesForTrack.length === 0) return track;

      const newNotes: Note[] = notesForTrack.map((noteDef) => {
        const duration = noteDef.duration ?? 0;
        const relativeTime = Math.max(0, noteDef.startTime - (offsetInCells * (60 / bpm / subRhythmSync)));
        const gridPosition = Math.max(
          0,
          Math.round(timeToCellPosition(relativeTime, bpm, subRhythmSync))
        );
        const gridWidth =
          duration === 0
            ? 1
            : Math.max(1, Math.round(timeToCellPosition(duration, bpm, subRhythmSync)));

        const specificAction = noteDef.action
          ? currentSpecificActions.find((a) => a.name.toLowerCase() === noteDef.action!.toLowerCase())
            ? { name: noteDef.action, icon: currentSpecificActions.find((a) => a.name.toLowerCase() === noteDef.action!.toLowerCase())!.icon }
            : undefined
          : undefined;

        return {
          id: generateId(),
          trackId: track.id,
          trackName: track.name,
          startTime: noteDef.startTime,
          duration,
          gridPosition,
          gridWidth,
          specificAction,
        };
      });

      return {
        ...track,
        notes: [...(track.notes || []), ...newNotes],
      };
    });
  }

  // 3. Settings
  const result: ApplyAIImportResult = { tracks, trackGroups };

  if (data.updateSettings) {
    const s = data.updateSettings;
    if (s.bpm !== undefined) result.bpm = s.bpm;
    if (s.rhythmSync !== undefined) result.rhythmSync = s.rhythmSync;
    if (s.subRhythmSync !== undefined) result.subRhythmSync = s.subRhythmSync;
    if (s.volume !== undefined) result.volume = s.volume;
    if (s.pitch !== undefined) result.pitch = s.pitch;
    if (s.startOffset !== undefined) result.startOffset = s.startOffset;
  }

  return result;
}
