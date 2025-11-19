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
 * Hook pour gérer la création de notes en temps réel pendant la lecture automatique
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
  // Map pour suivre les touches actuellement enfoncées
  const pressedKeysRef = useRef<Map<string, PressedKey>>(new Map());
  const [isRealtimeMode, setIsRealtimeMode] = useState(false);
  const [previewNotes, setPreviewNotes] = useState<PreviewNote[]>([]);

  // Le mode temps réel est actif seulement si auto-follow est activé ET la musique joue
  useEffect(() => {
    setIsRealtimeMode(isAutoFollowPlayback && isPlaying);
    
    // Si on quitte le mode temps réel, créer toutes les notes des touches encore enfoncées
    if (!isAutoFollowPlayback || !isPlaying) {
      const currentPressedKeys = Array.from(pressedKeysRef.current.entries());
      currentPressedKeys.forEach(([key, pressedKey]) => {
        createLongNote(pressedKey, currentTime);
      });
      pressedKeysRef.current.clear();
      setPreviewNotes([]);
    }
  }, [isAutoFollowPlayback, isPlaying]);

  // Mettre à jour les notes de prévisualisation en fonction du temps actuel
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
  }, [currentTime, isRealtimeMode, audioDuration, waveformWidth]);

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
      // Si la durée est nulle ou négative, créer une note courte
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
      // Ignorer si on est en train de taper dans un input/textarea
      const target = event.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isTyping) return;

      // Éviter les répétitions de l'événement keydown lors d'un appui long
      if (event.repeat) return;

      const key = event.key.toLowerCase();
      
      // Trouver la piste assignée à cette touche
      const track = tracks.find(t => t.assignedKey?.toLowerCase() === key);
      if (!track) return;

      // Empêcher le comportement par défaut
      event.preventDefault();

      // Si la touche n'est pas encore enfoncée, l'enregistrer
      if (!pressedKeysRef.current.has(key)) {
        const cellWidth = 24;
        const position = (currentTime / audioDuration) * waveformWidth;
        const gridPosition = Math.floor(position / cellWidth);

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

      // Calculer la durée et créer la note
      const duration = currentTime - pressedKey.startTime;
      
      if (duration < 0.1) {
        // Si l'appui est très court (< 100ms), créer une note courte
        createShortNote(pressedKey.trackId, pressedKey.startTime);
      } else {
        // Sinon créer une longue note
        createLongNote(pressedKey, currentTime);
      }

      // Retirer la touche de la map
      pressedKeysRef.current.delete(key);
      
      // Mettre à jour les preview notes
      setPreviewNotes(prev => prev.filter(p => p.trackId !== pressedKey.trackId));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRealtimeMode, tracks, currentTime, audioDuration, waveformWidth, onCreateNote]);

  return {
    isRealtimeMode,
    previewNotes,
  };
};
