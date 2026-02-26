import { Track } from "@/types/track";
import { TrackGroup } from "@/types/trackGroup";
import { Note } from "@/types/note";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

/**
 * Formate un nombre avec exactement 3 décimales
 */
const formatTimeValue = (value: number): number => {
  return Math.round(value * 1000) / 1000;
};

interface ExportNote {
  name: string;
  row: number; // Position of the track in the list (0, 1, 2, ...)
  time: number;
  duration: number;
  action?: string; // Just the action name
}

interface ExportData {
  projectName: string;
  bpm: number;
  duration: number;
  groups: {
    [key: string]: ExportNote[];
  };
}

export const exportToJson = async (bpm: number, tracks: Track[], trackGroups: TrackGroup[], projectName: string, musicDuration: number): Promise<number> => {
  // 1. Organize notes by group
  const notesByGroup: { [groupName: string]: ExportNote[] } = {};

  // Check if there are any tracks without a group
  const hasUngroupedTracks = tracks.some(track => !track.groupId);
  if (hasUngroupedTracks) {
    notesByGroup["Notes"] = [];
  }

  // Create categories for each group that actually contains tracks
  trackGroups.forEach(group => {
    // Only create the group if it has tracks associated with it
    const hasTracksInGroup = tracks.some(track => track.groupId === group.id);
    if (hasTracksInGroup) {
      notesByGroup[group.name] = [];
    }
  });

  let totalNotes = 0;

  // 2. Collect and organize notes
  tracks.forEach((track, rowIndex) => {
    if (track.notes && track.notes.length > 0) {
      const groupName = track.groupId
        ? trackGroups.find(g => g.id === track.groupId)?.name
        : null;

      const targetCategory = groupName || "Notes";

      track.notes.forEach(note => {
        const exportNote: ExportNote = {
          name: note.trackName,
          row: rowIndex, // Track position in the list
          time: formatTimeValue(note.startTime),
          duration: formatTimeValue(note.duration)
        };
        if (note.specificAction) {
          exportNote.action = note.specificAction.name; // Just the name
        }
        notesByGroup[targetCategory].push(exportNote);
        totalNotes++;
      });
    }
  });

  // 3. Sort each group by time
  Object.keys(notesByGroup).forEach(groupName => {
    notesByGroup[groupName].sort((a, b) => a.time - b.time);
  });

  const nonEmptyNotesByGroup = Object.fromEntries(
    Object.entries(notesByGroup).filter(([, notes]) => notes.length > 0)
  ) as { [groupName: string]: ExportNote[] };

  // 4. Create JSON structure
  const exportData: ExportData = {
    projectName: projectName || 'projet-sans-nom',
    bpm,
    duration: formatTimeValue(musicDuration),
    groups: nonEmptyNotesByGroup
  };

  // 5. Create the file and trigger download
  const jsonString = JSON.stringify(exportData, null, 2);

  try {
    if ('showSaveFilePicker' in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: `${projectName || 'projet-sans-nom'}.json`,
        types: [{
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(jsonString);
      await writable.close();
      return totalNotes;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.error(err);
    }
    return -1;
  }

  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${projectName || 'projet-sans-nom'}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return totalNotes;
};

export const exportToJsonFile = async (bpm: number, tracks: Track[], trackGroups: TrackGroup[], projectName: string, musicDuration: number, filePath?: string): Promise<{ success: boolean; filePath?: string; count: number }> => {
  try {
    // 1. Organize notes by group
    const notesByGroup: { [groupName: string]: ExportNote[] } = {};

    // Check if there are any tracks without a group
    const hasUngroupedTracks = tracks.some(track => !track.groupId);
    if (hasUngroupedTracks) {
      notesByGroup["Notes"] = [];
    }

    // Create categories for each group that actually contains tracks
    trackGroups.forEach(group => {
      // Only create the group if it has tracks associated with it
      const hasTracksInGroup = tracks.some(track => track.groupId === group.id);
      if (hasTracksInGroup) {
        notesByGroup[group.name] = [];
      }
    });

    let totalNotes = 0;

    // 2. Collect and organize notes
    tracks.forEach((track, rowIndex) => {
      if (track.notes && track.notes.length > 0) {
        const groupName = track.groupId
          ? trackGroups.find(g => g.id === track.groupId)?.name
          : null;

        const targetCategory = groupName || "Notes";

        track.notes.forEach(note => {
          const exportNote: ExportNote = {
            name: note.trackName,
            row: rowIndex, // Track position in the list
            time: formatTimeValue(note.startTime),
            duration: formatTimeValue(note.duration)
          };
          if (note.specificAction) {
            exportNote.action = note.specificAction.name; // Just the name
          }
          notesByGroup[targetCategory].push(exportNote);
          totalNotes++;
        });
      }
    });

    // 3. Sort each group by time
    Object.keys(notesByGroup).forEach(groupName => {
      notesByGroup[groupName].sort((a, b) => a.time - b.time);
    });

    const nonEmptyNotesByGroup = Object.fromEntries(
      Object.entries(notesByGroup).filter(([, notes]) => notes.length > 0)
    ) as { [groupName: string]: ExportNote[] };

    // 4. Create JSON structure
    const exportData: ExportData = {
      projectName: projectName || 'projet-sans-nom',
      bpm,
      duration: formatTimeValue(musicDuration),
      groups: nonEmptyNotesByGroup
    };

    let targetPath = filePath;

    if (!targetPath) {
      // Open the save dialog
      targetPath = await save({
        filters: [
          {
            name: "JSON Files",
            extensions: ["json"]
          }
        ],
        defaultPath: `${projectName || 'projet-sans-nom'}.json`
      });

      if (!targetPath) {
        return { success: false, count: totalNotes };
      }
    }

    // 5. Write the file
    const jsonString = JSON.stringify(exportData, null, 2);
    await writeTextFile(targetPath, jsonString);

    return { success: true, filePath: targetPath, count: totalNotes };
  } catch (error) {
    console.error("Error exporting:", error);
    return { success: false, count: 0 };
  }
};
