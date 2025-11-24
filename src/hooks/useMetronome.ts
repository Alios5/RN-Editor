import { useEffect, useRef, useState } from 'react';

interface UseMetronomeProps {
  bpm: number;
  isPlaying: boolean;
  enabled: boolean;
  volume: number; // 0-100
  currentTime: number;
}

export const useMetronome = ({ bpm, isPlaying, enabled, volume, currentTime }: UseMetronomeProps) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs for values that shouldn't trigger restart
  const volumeRef = useRef(volume);
  const bpmRef = useRef(bpm);
  const isPlayingRef = useRef(isPlaying);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Initialize Audio Context
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      setIsInitialized(true);
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  // Schedule the next note
  const scheduleNote = (time: number) => {
    if (!audioContextRef.current || !enabledRef.current) return;

    const audioContext = audioContextRef.current;

    // Create oscillator for the click sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // High-pitched short beep
    oscillator.frequency.value = 1000;

    // Volume envelope (quick attack and decay)
    const volumeValue = volumeRef.current / 100;
    gainNode.gain.setValueAtTime(volumeValue, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    oscillator.start(time);
    oscillator.stop(time + 0.05);
  };

  // Scheduler loop
  const scheduler = () => {
    if (!audioContextRef.current) return;

    const lookahead = 0.1; // How far ahead to schedule audio (in seconds)
    const scheduleAheadTime = 0.1; // How frequently to call scheduling function (in seconds)

    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + lookahead) {
      scheduleNote(nextNoteTimeRef.current);
      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTimeRef.current += secondsPerBeat;
    }

    timerIDRef.current = window.setTimeout(scheduler, scheduleAheadTime * 1000);
  };

  // Start/Stop metronome
  useEffect(() => {
    if (!isInitialized || !audioContextRef.current) return;

    if (isPlaying && enabled) {
      // Resume audio context if suspended (browser autoplay policy)
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      // Calculate the next beat time aligned with the music
      // We use the passed currentTime (which is the music's current time)
      // and align it with the audioContext's time

      const secondsPerBeat = 60.0 / bpm;

      // Calculate where we are in the beat grid
      // currentBeat = currentTime / secondsPerBeat
      // nextBeatIndex = Math.ceil(currentBeat)
      // nextBeatTimeInMusic = nextBeatIndex * secondsPerBeat

      // We need to map "Music Time" to "AudioContext Time"
      // AudioContext Time = Now
      // Music Time = currentTime
      // Delta = AudioContext.currentTime - currentTime (roughly)

      // However, for perfect sync, we should just start from "Now" aligned to the grid
      // But "Now" is arbitrary relative to the music grid.

      // Correct approach:
      // 1. Determine the next beat in "Music Time"
      // 2. Calculate how far that is from "Now" (Music Time)
      // 3. Schedule it at AudioContext.currentTime + (NextBeatMusicTime - CurrentMusicTime)

      const currentMusicTime = currentTime;
      const nextBeatIndex = Math.ceil(currentMusicTime / secondsPerBeat);
      const nextBeatMusicTime = nextBeatIndex * secondsPerBeat;
      const timeToNextBeat = Math.max(0, nextBeatMusicTime - currentMusicTime);

      nextNoteTimeRef.current = audioContextRef.current.currentTime + timeToNextBeat;

      scheduler();
    } else {
      // Stop scheduling
      if (timerIDRef.current !== null) {
        clearTimeout(timerIDRef.current);
        timerIDRef.current = null;
      }
    }

    return () => {
      if (timerIDRef.current !== null) {
        clearTimeout(timerIDRef.current);
        timerIDRef.current = null;
      }
    };
  }, [isPlaying, enabled, isInitialized]); // Removed volume and bpm from dependencies to prevent restart

  return { isInitialized };
};
