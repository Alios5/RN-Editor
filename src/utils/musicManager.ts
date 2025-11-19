import { copyFile, exists, mkdir } from "@tauri-apps/plugin-fs";
import { dirname, join, basename } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc } from "@tauri-apps/api/core";

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
export const selectAudioFile = async (): Promise<string | null> => {
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
