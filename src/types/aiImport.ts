export interface AIImportTrack {
  name: string;
  color?: string;
  groupName?: string;
}

export interface AIImportNote {
  trackName: string;
  startTime: number;
  duration?: number;
  action?: string;
}

export interface AIImportSettings {
  bpm?: number;
  rhythmSync?: number;
  subRhythmSync?: number;
  volume?: number;
  pitch?: number;
  startOffset?: number;
}

export interface AIImportData {
  addTracks?: AIImportTrack[];
  addNotes?: AIImportNote[];
  updateSettings?: AIImportSettings;
}
