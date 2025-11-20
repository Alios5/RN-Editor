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
  trackName: string;
  startTime: number;
  duration: number;
  specificAction?: string; // Just the action name
}

interface ExportData {
  bpm: number;
  musicDuration: number;
  [key: string]: number | ExportNote[]; // bpm, musicDuration (number) or note lists
}

export const exportToJson = (bpm: number, tracks: Track[], trackGroups: TrackGroup[], projectName: string, musicDuration: number): number => {
  // 1. Organize notes by group
  const notesByGroup: { [groupName: string]: ExportNote[] } = {
    "Notes": []
  };

  // Create categories for each group
  trackGroups.forEach(group => {
    notesByGroup[group.name] = [];
  });

  let totalNotes = 0;

  // 2. Collect and organize notes
  tracks.forEach(track => {
    if (track.notes && track.notes.length > 0) {
      const groupName = track.groupId 
        ? trackGroups.find(g => g.id === track.groupId)?.name 
        : null;
      
      const targetCategory = groupName || "Notes";
      
      track.notes.forEach(note => {
        const exportNote: ExportNote = {
          trackName: note.trackName,
          startTime: formatTimeValue(note.startTime),
          duration: formatTimeValue(note.duration)
        };
        if (note.specificAction) {
          exportNote.specificAction = note.specificAction.name; // Just the name
        }
        notesByGroup[targetCategory].push(exportNote);
        totalNotes++;
      });
    }
  });

  // 3. Sort each group by startTime
  Object.keys(notesByGroup).forEach(groupName => {
    notesByGroup[groupName].sort((a, b) => a.startTime - b.startTime);
  });

  // 4. Create JSON structure
  const exportData: ExportData = {
    bpm,
    musicDuration: formatTimeValue(musicDuration),
    ...notesByGroup
  };

  // 5. Create the file and trigger download
  const jsonString = JSON.stringify(exportData, null, 2);
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
    const notesByGroup: { [groupName: string]: ExportNote[] } = {
      "Notes": []
    };

    // Create categories for each group
    trackGroups.forEach(group => {
      notesByGroup[group.name] = [];
    });

    let totalNotes = 0;

    // 2. Collect and organize notes
    tracks.forEach(track => {
      if (track.notes && track.notes.length > 0) {
        const groupName = track.groupId 
          ? trackGroups.find(g => g.id === track.groupId)?.name 
          : null;
        
        const targetCategory = groupName || "Notes";
        
        track.notes.forEach(note => {
          const exportNote: ExportNote = {
            trackName: note.trackName,
            startTime: formatTimeValue(note.startTime),
            duration: formatTimeValue(note.duration)
          };
          if (note.specificAction) {
            exportNote.specificAction = note.specificAction.name; // Just the name
          }
          notesByGroup[targetCategory].push(exportNote);
          totalNotes++;
        });
      }
    });

    // 3. Sort each group by startTime
    Object.keys(notesByGroup).forEach(groupName => {
      notesByGroup[groupName].sort((a, b) => a.startTime - b.startTime);
    });

    // 4. Create JSON structure
    const exportData: ExportData = {
      bpm,
      musicDuration: formatTimeValue(musicDuration),
      ...notesByGroup
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
