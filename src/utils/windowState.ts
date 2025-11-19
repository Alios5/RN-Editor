import { getCurrentWindow, LogicalSize, LogicalPosition } from "@tauri-apps/api/window";

interface WindowState {
  width: number;
  height: number;
  x: number;
  y: number;
  maximized: boolean;
}

const WINDOW_STATE_KEY = "rn-editor-window-state";

/**
 * Save the current window state to localStorage
 */
export const saveWindowState = async (): Promise<void> => {
  try {
    const appWindow = getCurrentWindow();
    
    // Check if window is minimized - don't save state if minimized
    const isMinimized = await appWindow.isMinimized();
    if (isMinimized) {
      console.log("Window is minimized, skipping state save");
      return;
    }
    
    // Get window properties
    const [scaleFactor, outerSize, outerPosition, isMaximized] = await Promise.all([
      appWindow.scaleFactor(),
      appWindow.outerSize(),
      appWindow.outerPosition(),
      appWindow.isMaximized()
    ]);

    const state: WindowState = {
      width: outerSize.width / scaleFactor,
      height: outerSize.height / scaleFactor,
      x: outerPosition.x,
      y: outerPosition.y,
      maximized: isMaximized
    };

    localStorage.setItem(WINDOW_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save window state:", error);
  }
};

/**
 * Restore the window state from localStorage
 */
export const restoreWindowState = async (): Promise<void> => {
  try {
    const savedState = localStorage.getItem(WINDOW_STATE_KEY);
    if (!savedState) return;

    const state: WindowState = JSON.parse(savedState);
    const appWindow = getCurrentWindow();

    // Restore maximized state
    if (state.maximized) {
      await appWindow.maximize();
    } else {
      // Restore size and position
      await appWindow.unmaximize();
      await appWindow.setSize(new LogicalSize(state.width, state.height));
      await appWindow.setPosition(new LogicalPosition(state.x, state.y));
    }
  } catch (error) {
    console.error("Failed to restore window state:", error);
  }
};

/**
 * Setup automatic window state saving
 * Returns a cleanup function to remove event listeners
 */
export const setupWindowStatePersistence = async (): Promise<() => void> => {
  const appWindow = getCurrentWindow();
  
  // Debounce timer to avoid saving too frequently
  let saveTimer: number | null = null;
  
  const debouncedSave = () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
    saveTimer = window.setTimeout(() => {
      saveWindowState();
    }, 500);
  };

  // Listen to window resize and move events
  const unlistenResize = await appWindow.onResized(debouncedSave);
  const unlistenMove = await appWindow.onMoved(debouncedSave);

  // Save on window close
  const unlistenCloseRequested = await appWindow.onCloseRequested(async () => {
    await saveWindowState();
  });

  // Return cleanup function
  return () => {
    unlistenResize();
    unlistenMove();
    unlistenCloseRequested();
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
  };
};
