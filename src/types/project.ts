import { Track } from "./track";
import { TrackGroup } from "./trackGroup";
import { SpecificAction } from "./specificAction";

export interface Project {
  id: string;
  name: string;
  filePath?: string; // Path to the .rne file
  musicPath?: string; // Path to the audio file
  musicFilePath?: string; // Alias for musicPath (compatibility)
  musicFileName?: string; // Audio file name for display
  bpm: number;
  rhythmSync: number;
  subRhythmSync: number;
  volume: number;
  pitch: number;
  pitchShift?: number; // Alias for pitch (compatibility)
  startOffset: number;
  tracks: Track[];
  trackGroups?: TrackGroup[]; // Track groups
  specificActions?: SpecificAction[]; // Specific actions
  createdAt: string;
  updatedAt: string;
}
