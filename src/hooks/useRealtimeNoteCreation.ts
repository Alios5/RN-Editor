import { useEffect, useRef, useState } from 'react';
import { Track } from '@/types/track';
import { Note } from '@/types/note';
import { timeToPixelPosition, timeToGridPosition } from '@/utils/gridPositionCalculator';

interface RealtimeNoteCreationOptions {
  tracks: Track[];
  isAutoFollowPlayback: boolean;
  isPlaying: boolean;
  currentTime: number;
  audioDuration: number;
  waveformWidth: number;
  bpm: number;
  subRhythmSync: number;
  onCreateNote: (trackId: string, note: Omit<Note, 'id' | 'trackId' | 'trackName'>) => void;
}

interface PressedKey {
  trackId: string;
  startTime: number;
  startGridPosition: number;
}

export interface PreviewNote {
  trackId: string;
  gridPosition: number;
  gridWidth: number;
}

/**
 * Hook to manage real-time note creation during auto-playback
 */
export const useRealtimeNoteCreation = ({
  tracks,
  isAutoFollowPlayback,
  isPlaying,
  currentTime,
  audioDuration,
  waveformWidth,
  bpm,
  subRhythmSync,
  onCreateNote,
}: RealtimeNoteCreationOptions) => {
  // Map to track currently pressed keys
  const pressedKeysRef = useRef<Map<string, PressedKey>>(new Map());
  const [isRealtimeMode, setIsRealtimeMode] = useState(false);
  const [previewNotes, setPreviewNotes] = useState<PreviewNote[]>([]);

  // Real-time mode is active only if auto-follow is enabled AND music is playing
  useEffect(() => {
    setIsRealtimeMode(isAutoFollowPlayback && isPlaying);

    // If leaving real-time mode, create notes for all keys still pressed
    if (!isAutoFollowPlayback || !isPlaying) {
      const currentPressedKeys = Array.from(pressedKeysRef.current.entries());
      currentPressedKeys.forEach(([key, pressedKey]) => {
        createLongNote(pressedKey, currentTime);
      });
      pressedKeysRef.current.clear();
      setPreviewNotes([]);
    }
  }, [isAutoFollowPlayback, isPlaying]);

  // Update preview notes based on current time
  useEffect(() => {
    if (!isRealtimeMode || pressedKeysRef.current.size === 0) {
      setPreviewNotes([]);
      return;
    }

    const cellWidth = 24;
    const previews: PreviewNote[] = [];

    pressedKeysRef.current.forEach((pressedKey) => {
      const startPosition = timeToPixelPosition(pressedKey.startTime, bpm, subRhythmSync);
      const currentPosition = timeToPixelPosition(currentTime, bpm, subRhythmSync);
      const widthInPixels = Math.max(cellWidth, currentPosition - startPosition);
      const gridWidth = Math.max(1, Math.round(widthInPixels / cellWidth));

      previews.push({
        trackId: pressedKey.trackId,
        gridPosition: pressedKey.startGridPosition,
        gridWidth,
      });
    });

    setPreviewNotes(previews);
  }, [currentTime, isRealtimeMode, bpm, subRhythmSync]);

  const createShortNote = (trackId: string, currentTime: number) => {
    const gridPosition = timeToGridPosition(currentTime, bpm, subRhythmSync);

    onCreateNote(trackId, {
      startTime: currentTime,
      duration: 0, // Short note
      gridPosition,
      gridWidth: 1,
    });
  };

  const createLongNote = (pressedKey: PressedKey, endTime: number) => {
    const cellWidth = 24;
    const duration = endTime - pressedKey.startTime;

    if (duration <= 0) {
      // If duration is zero or negative, create a short note
      createShortNote(pressedKey.trackId, pressedKey.startTime);
      return;
    }

    const startPosition = timeToPixelPosition(pressedKey.startTime, bpm, subRhythmSync);
    const endPosition = timeToPixelPosition(endTime, bpm, subRhythmSync);
    const widthInPixels = endPosition - startPosition;
    const gridWidth = Math.max(1, Math.round(widthInPixels / cellWidth));

    onCreateNote(pressedKey.trackId, {
      startTime: pressedKey.startTime,
      duration,
      gridPosition: pressedKey.startGridPosition,
      gridWidth,
    });
  };

  useEffect(() => {
    if (!isRealtimeMode) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in an input/textarea
      const target = event.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isTyping) return;

      // Prevent keydown event repetition during long press
      if (event.repeat) return;

      const key = event.key.toLowerCase();

      // Find the track assigned to this key
      const track = tracks.find(t => t.assignedKey?.toLowerCase() === key);
      if (!track) return;

      // Prevent default behavior
      event.preventDefault();

      // If key is not yet pressed, record it
      if (!pressedKeysRef.current.has(key)) {
        // Use standardized function for perfect consistency
        const gridPosition = timeToGridPosition(currentTime, bpm, subRhythmSync);

        pressedKeysRef.current.set(key, {
          trackId: track.id,
          startTime: currentTime,
          startGridPosition: gridPosition,
        });
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      const pressedKey = pressedKeysRef.current.get(key);
      if (!pressedKey) return;

      event.preventDefault();

      // Calculate duration and create note
      const duration = currentTime - pressedKey.startTime;

      if (duration < 0.1) {
        // If the press is very short (< 100ms), create a short note
        createShortNote(pressedKey.trackId, pressedKey.startTime);
      } else {
        // Otherwise create a long note
        createLongNote(pressedKey, currentTime);
      }

      // Remove key from the map
      pressedKeysRef.current.delete(key);

      // Update preview notes
      setPreviewNotes(prev => prev.filter(p => p.trackId !== pressedKey.trackId));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRealtimeMode, tracks, currentTime, bpm, subRhythmSync, onCreateNote]);

  return {
    isRealtimeMode,
    previewNotes,
  };
};
