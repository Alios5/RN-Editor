import { useEffect, useRef } from "react";
import { useWavesurfer } from "@wavesurfer/react";
import { panelColors } from '@/lib/panelColors';

interface WaveformProps {
  audioUrl?: string;
  currentTime?: number;
  isPlaying?: boolean;
  onSeek?: (time: number) => void;
  onDragSeek?: (time: number) => void;
  width?: number;
}

export const Waveform = ({ audioUrl, currentTime = 0, isPlaying = false, onSeek, onDragSeek, width }: WaveformProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Get waveform color from CSS variable (theme-aware)
  const waveformColor = getComputedStyle(document.documentElement).getPropertyValue('--waveform-color').trim();
  const waveformColorHSL = waveformColor ? `hsl(${waveformColor})` : "hsl(230, 20%, 25%)";

  const { wavesurfer, isReady } = useWavesurfer({
    container: containerRef,
    url: audioUrl,
    waveColor: waveformColorHSL,
    progressColor: waveformColorHSL, // Même couleur que waveColor (la ligne de position indique déjà la progression)
    cursorWidth: 0, // Cacher la ligne de lecture de WaveSurfer (on utilise PlayheadLine à la place)
    height: 100,
    barWidth: 2,
    barGap: 1,
    barRadius: 2,
    barHeight: 1,
    normalize: true,
    dragToSeek: true,
    hideScrollbar: true,
    autoCenter: false,
    media: undefined, // Disable WaveSurfer's internal audio playback
    interact: true, // Always allow interaction for seeking
  });

  useEffect(() => {
    if (!audioUrl || !wavesurfer) return;
    
    // Load new audio URL
    wavesurfer.load(audioUrl);
  }, [audioUrl, wavesurfer]);

  // Direct and precise synchronization with audio player
  useEffect(() => {
    if (!wavesurfer || !isReady) return;
    
    wavesurfer.setTime(currentTime);
  }, [currentTime, wavesurfer, isReady]);

  // Listen to user interactions (clicks/drags) on waveform
  useEffect(() => {
    if (!wavesurfer) return;
    
    // During drag - visual update only
    const handleDrag = () => {
      const newTime = wavesurfer.getCurrentTime();
      onDragSeek?.(newTime);
    };
    
    // At the end of drag/click - update actual audio position
    const handleInteraction = () => {
      const newTime = wavesurfer.getCurrentTime();
      onSeek?.(newTime);
    };
    
    // Listen to drags (visual update)
    wavesurfer.on('drag', handleDrag);
    
    // Listen to interaction end (audio update)
    wavesurfer.on('interaction', handleInteraction);
    
    return () => {
      wavesurfer.un('drag', handleDrag);
      wavesurfer.un('interaction', handleInteraction);
    };
  }, [wavesurfer, onSeek, onDragSeek]);

  return (
    <div className="w-full h-[100px] rounded-lg overflow-hidden relative" style={{ backgroundColor: panelColors.sectionBackground() }}>
      <div 
        ref={containerRef} 
        className="h-full"
        style={{ width: width ? `${width}px` : '100%', cursor: 'text' }}
      />
      {!isReady && audioUrl && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: panelColors.sectionBackground() }}>
          <p className="text-sm text-muted-foreground">Chargement de la forme d'onde...</p>
        </div>
      )}
    </div>
  );
};
