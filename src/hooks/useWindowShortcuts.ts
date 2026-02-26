import { useEffect } from 'react';
import { useShortcuts } from './useShortcuts';
import { toggleMaximize, toggleFullscreen } from '@/utils/windowCommands';

/**
 * Hook to handle global window shortcuts
 */
export const useWindowShortcuts = () => {
  const { matchesShortcut } = useShortcuts();

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      const isDialogOpen = document.querySelector('[role="dialog"], [role="alertdialog"]') !== null;
      if (isDialogOpen) return;

      // Toggle maximize: Ctrl+Shift+M
      if (matchesShortcut('toggleMaximize', event)) {
        event.preventDefault();
        await toggleMaximize();
        return;
      }

      // Toggle fullscreen: F11
      if (matchesShortcut('toggleFullscreen', event)) {
        event.preventDefault();
        await toggleFullscreen();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [matchesShortcut]);
};
