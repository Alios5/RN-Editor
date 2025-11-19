import { invoke } from '@tauri-apps/api/core';

/**
 * Toggle window maximize/restore state
 */
export async function toggleMaximize(): Promise<void> {
  try {
    await invoke('toggle_maximize');
  } catch (error) {
    console.error('Failed to toggle maximize:', error);
  }
}

/**
 * Maximize the window
 */
export async function maximizeWindow(): Promise<void> {
  try {
    await invoke('maximize_window');
  } catch (error) {
    console.error('Failed to maximize window:', error);
  }
}

/**
 * Restore the window to normal size
 */
export async function restoreWindow(): Promise<void> {
  try {
    await invoke('restore_window');
  } catch (error) {
    console.error('Failed to restore window:', error);
  }
}

/**
 * Toggle fullscreen mode
 */
export async function toggleFullscreen(): Promise<void> {
  try {
    await invoke('toggle_fullscreen');
  } catch (error) {
    console.error('Failed to toggle fullscreen:', error);
  }
}
