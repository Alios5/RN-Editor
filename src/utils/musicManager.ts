import { copyFile, exists, mkdir } from "@tauri-apps/plugin-fs";
import { dirname, join, basename } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc } from "@tauri-apps/api/core";
import { isDesktop } from "./platform";
import { loadAudioFromDB } from "./indexedDB";

/**
 * Checks if a music file is in the same folder as the RNE file
 * @param musicPath Path to the music file
 * @param rneFilePath Path to the RNE file
 * @returns true if the music is in the same folder
 */
export const isMusicInProjectFolder = async (
  musicPath: string,
  rneFilePath: string
): Promise<boolean> => {
  if (!isDesktop()) return false;
  try {
    const musicDir = await dirname(musicPath);
    const rneDir = await dirname(rneFilePath);
    return musicDir === rneDir;
  } catch (error) {
    console.error("Error checking folder:", error);
    return false;
  }
};

/**
 * Copies a music file to the project folder
 * @param sourceMusicPath Source path of the music file
 * @param targetFolderPath Target folder
 * @returns The new path of the copied file or null if error
 */
export const copyMusicToProjectFolder = async (
  sourceMusicPath: string,
  targetFolderPath: string
): Promise<string | null> => {
  if (!isDesktop()) return null;
  try {
    // Extract the file name
    const fileName = await basename(sourceMusicPath);

    // Create the destination path
    const targetPath = await join(targetFolderPath, fileName);

    // Check if the target folder exists, otherwise create it
    const folderExists = await exists(targetFolderPath);
    if (!folderExists) {
      await mkdir(targetFolderPath, { recursive: true });
    }

    // Copy the file
    await copyFile(sourceMusicPath, targetPath);

    return targetPath;
  } catch (error) {
    console.error("Error copying music file:", error);
    return null;
  }
};

/**
 * Opens a dialog to select an audio file
 * @returns The path of the selected file or null if cancelled
 */
export const selectAudioFile = async (): Promise<string | File | null> => {
  if (!isDesktop()) {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "audio/*";
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        resolve(file || null);
      };
      input.oncancel = () => resolve(null);
      input.click();
    });
  }

  try {
    const filePath = await open({
      filters: [
        {
          name: "Audio Files",
          extensions: ["mp3", "wav", "ogg", "flac", "m4a", "aac"]
        }
      ],
      multiple: false,
      directory: false
    });

    if (!filePath || Array.isArray(filePath)) {
      return null;
    }

    return filePath;
  } catch (error) {
    console.error("Error selecting audio file:", error);
    return null;
  }
};

/**
 * Calculates the relative path of a music file relative to the RNE file
 * @param musicPath Absolute path of the music
 * @param rneFilePath Path to the RNE file
 * @returns The file name if in the same folder, otherwise the absolute path
 */
export const getRelativeMusicPath = async (
  musicPath: string,
  rneFilePath: string
): Promise<string> => {
  if (!isDesktop()) return musicPath;
  try {
    const isInSameFolder = await isMusicInProjectFolder(musicPath, rneFilePath);
    if (isInSameFolder) {
      // Return only the file name
      return await basename(musicPath);
    }
    // Return the absolute path
    return musicPath;
  } catch (error) {
    console.error("Error calculating relative path:", error);
    return musicPath;
  }
};

/**
 * Resolves a music path (relative or absolute) to an absolute path
 * @param musicPath Path to the music (can be relative)
 * @param rneFilePath Path to the RNE file
 * @returns The absolute path of the music
 */
export const resolveMusicPath = async (
  musicPath: string,
  rneFilePath: string
): Promise<string> => {
  if (!isDesktop()) return musicPath;
  try {
    // If the path contains a folder separator, it's an absolute path
    if (musicPath.includes("/") || musicPath.includes("\\")) {
      return musicPath;
    }

    // Otherwise, it's a relative file name
    const rneDir = await dirname(rneFilePath);
    return await join(rneDir, musicPath);
  } catch (error) {
    console.error("Error resolving path:", error);
    return musicPath;
  }
};

/**
 * Converts a file path to a URL usable by HTML audio elements
 * @param filePath Path to the file
 * @returns Converted URL for Tauri
 */
export const convertFilePathToAudioUrl = (filePath: string): string => {
  if (!filePath) return "";
  return convertFileSrc(filePath);
};

/**
 * Loads audio file into a URL, using platform-specific behavior.
 * Linux WebKitGTK struggles with large audio files over the asset:// protocol,
 * so we load it into a memory Blob.
 * @param filePath Path to the file
 * @returns Promise with URL (blob: on Linux, asset:// on others)
 */
export const loadAudioPlatformSpecific = async (filePath: string, projectId?: string): Promise<string> => {
  if (!filePath) return "";

  if (!isDesktop() && projectId) {
    try {
      // On web, try to load from IndexedDB first
      const audioData = await loadAudioFromDB(projectId);
      if (audioData) {
        return URL.createObjectURL(audioData.file);
      }
    } catch (e) {
      console.error("Failed to load audio from DB:", e);
    }
    // If not found in DB or error (e.g. provided as a direct web URL instead)
    // we can fallback to standard URL loading if it's a blob or http link
    if (filePath.startsWith("blob:") || filePath.startsWith("http")) {
      return filePath;
    }
    return "";
  }

  try {
    const isLinux = navigator.userAgent.toLowerCase().includes('linux');

    if (isLinux) {
      // On Linux, read file to memory and create a Blob to fix webkitgtk streaming issues
      const { readFile } = await import("@tauri-apps/plugin-fs");
      const data = await readFile(filePath);

      // Determine mime type from extension
      const ext = filePath.split('.').pop()?.toLowerCase() || '';
      let mimeType = 'audio/mpeg'; // default mp3
      if (ext === 'wav') mimeType = 'audio/wav';
      else if (ext === 'ogg') mimeType = 'audio/ogg';
      else if (ext === 'flac') mimeType = 'audio/flac';
      else if (ext === 'm4a' || ext === 'aac') mimeType = 'audio/aac';

      const blob = new Blob([data], { type: mimeType });
      return URL.createObjectURL(blob);
    }
  } catch (error) {
    console.warn("Failed to load audio via platform-specific method, falling back to convertFileSrc:", error);
  }

  // Fallback / Windows / macOS behavior
  return convertFileSrc(filePath);
};
