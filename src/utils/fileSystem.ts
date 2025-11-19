import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile, exists } from "@tauri-apps/plugin-fs";
import { Project } from "@/types/project";
import { addProjectMetadata, updateProjectMetadata } from "./localStorage";
import { getRelativeMusicPath, resolveMusicPath } from "./musicManager";
import { setFileReadonly, isFileReadonly } from "./fileProtection";
import pako from "pako";

export interface RNEFileFormat {
  version: string;
  project: Project;
  exportedAt: string;
}

/**
 * Encodes project data using Base64 + Compression
 * @param data The RNE file data to encode
 * @returns Base64 encoded string
 */
function encodeProjectData(data: RNEFileFormat): string {
  try {
    const jsonString = JSON.stringify(data);
    const compressed = pako.deflate(jsonString);
    const base64 = btoa(String.fromCharCode(...Array.from(compressed)));
    return base64;
  } catch (error) {
    console.error("Error encoding project data:", error);
    throw error;
  }
}

/**
 * Decodes Base64 + Compressed project data
 * @param encoded The encoded string
 * @returns Decoded RNE file data
 */
function decodeProjectData(encoded: string): RNEFileFormat {
  try {
    const decoded = atob(encoded);
    const compressed = Uint8Array.from(decoded, c => c.charCodeAt(0));
    const jsonString = pako.inflate(compressed, { to: 'string' });
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error decoding project data:", error);
    throw error;
  }
}

/**
 * Detects if the file content is encoded or plain JSON
 * @param content The file content
 * @returns true if encoded, false if plain JSON
 */
function isEncodedContent(content: string): boolean {
  // Encoded content is Base64, so it should not start with '{' or have whitespace
  const trimmed = content.trim();
  // Base64 only contains A-Z, a-z, 0-9, +, /, =
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  return base64Regex.test(trimmed) && !trimmed.startsWith('{');
}

/**
 * Saves a project to a .rne file
 * @param project The project to save
 * @param filePath File path (optional, opens a dialog if not provided)
 * @returns The path of the saved file or null if cancelled
 */
export const saveProjectToFile = async (project: Project, filePath?: string): Promise<string | null> => {
  try {
    let targetPath = filePath;
    
    if (!targetPath) {
      // Open the save dialog
      targetPath = await save({
        filters: [
          {
            name: "RhythmNator Project",
            extensions: ["rne"]
          }
        ],
        defaultPath: `${project.name}.rne`
      });
      
      if (!targetPath) {
        return null; // User cancelled
      }
    }

    // Convert the music path to a relative path if it's in the same folder
    let musicPathToSave = project.musicPath;
    if (project.musicPath && targetPath) {
      musicPathToSave = await getRelativeMusicPath(project.musicPath, targetPath);
    }

    // Create the .rne file format
    const rneData: RNEFileFormat = {
      version: "1.0.0",
      project: {
        ...project,
        musicPath: musicPathToSave,
        filePath: targetPath,
        updatedAt: new Date().toISOString()
      },
      exportedAt: new Date().toISOString()
    };

    // Encode the data (Base64 + Compression)
    const encodedData = encodeProjectData(rneData);

    // Remove read-only attribute temporarily if the file exists
    const fileExists = await exists(targetPath);
    if (fileExists) {
      const isReadonly = await isFileReadonly(targetPath);
      if (isReadonly) {
        console.log("Removing read-only attribute temporarily for save...");
        await setFileReadonly(targetPath, false);
      }
    }

    // Write the encoded file
    await writeTextFile(targetPath, encodedData);

    // Set the file as read-only to protect it from external modifications
    console.log("Setting file as read-only to protect from external edits...");
    await setFileReadonly(targetPath, true);

    // Update metadata in localStorage
    const updatedProject = { ...project, filePath: targetPath };
    addProjectMetadata(updatedProject);

    return targetPath;
  } catch (error) {
    console.error("Error saving:", error);
    throw error;
  }
};

/**
 * Saves a project with a new name (Save As)
 * @param project The project to save
 * @returns The path of the saved file or null if cancelled
 */
export const saveProjectAs = async (project: Project): Promise<string | null> => {
  return saveProjectToFile(project); // Force dialog opening
};

/**
 * Loads a project from a .rne file
 * @param filePath Path to the file to load
 * @returns The loaded project or null if error
 */
export const loadProjectFromFile = async (filePath: string): Promise<Project | null> => {
  try {
    // Check if the file exists
    const fileExists = await exists(filePath);
    if (!fileExists) {
      throw new Error(`File ${filePath} does not exist`);
    }

    // Read the file
    const fileContent = await readTextFile(filePath);
    
    // Detect if the content is encoded or plain JSON (backward compatibility)
    let rneData: RNEFileFormat;
    if (isEncodedContent(fileContent)) {
      // New format: encoded
      console.log("Loading encoded project file...");
      rneData = decodeProjectData(fileContent);
    } else {
      // Old format: plain JSON
      console.log("Loading legacy plain JSON project file...");
      rneData = JSON.parse(fileContent);
    }

    // Validate the format
    if (!rneData.project) {
      throw new Error("Invalid file format");
    }

    // Resolve the music path (relative to absolute)
    let resolvedMusicPath = rneData.project.musicPath;
    if (rneData.project.musicPath) {
      resolvedMusicPath = await resolveMusicPath(rneData.project.musicPath, filePath);
    }

    // Return the project with the file path
    const project: Project = {
      ...rneData.project,
      musicPath: resolvedMusicPath,
      filePath: filePath
    };

    // Update metadata in localStorage
    addProjectMetadata(project);

    return project;
  } catch (error) {
    console.error("Error loading:", error);
    throw error;
  }
};

/**
 * Opens a dialog to select and load a .rne file
 * @returns The loaded project or null if cancelled/error
 */
export const openProjectFile = async (): Promise<Project | null> => {
  try {
    // Open the open dialog
    const filePath = await open({
      filters: [
        {
          name: "RhythmNator Project",
          extensions: ["rne"]
        }
      ],
      multiple: false
    });

    if (!filePath || Array.isArray(filePath)) {
      return null; // User cancelled or error
    }

    // Load the project
    return await loadProjectFromFile(filePath);
  } catch (error) {
    console.error("Error opening:", error);
    throw error;
  }
};

/**
 * Checks if a .rne file exists
 * @param filePath Path to the file
 * @returns true if the file exists
 */
export const projectFileExists = async (filePath: string): Promise<boolean> => {
  try {
    return await exists(filePath);
  } catch (error) {
    return false;
  }
};