import { invoke } from "@tauri-apps/api/core";

/**
 * Sets or removes the read-only attribute of a file
 * @param filePath Path to the file
 * @param readonly True to set read-only, false to remove
 */
export const setFileReadonly = async (filePath: string, readonly: boolean): Promise<void> => {
  try {
    await invoke<void>("set_file_readonly", { filePath, readonly });
  } catch (error) {
    console.error(`Error setting file readonly attribute:`, error);
    throw error;
  }
};

/**
 * Checks if a file has the read-only attribute
 * @param filePath Path to the file
 * @returns True if the file is read-only
 */
export const isFileReadonly = async (filePath: string): Promise<boolean> => {
  try {
    return await invoke<boolean>("is_file_readonly", { filePath });
  } catch (error) {
    console.error(`Error checking file readonly attribute:`, error);
    throw error;
  }
};
