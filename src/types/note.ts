import { NoteAction } from "./specificAction";

export interface Note {
  id: string;
  trackId: string;
  trackName: string;
  startTime: number; // in seconds
  duration: number; // in seconds
  gridPosition: number; // cell index (0, 1, 2, ...)
  gridWidth: number; // number of cells
  specificAction?: NoteAction; // Specific action linked to the note
}
