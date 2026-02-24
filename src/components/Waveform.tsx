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
  startOffset?: number;
}

export const Waveform = ({ audioUrl, currentTime = 0, isPlaying = false, onSeek, onDragSeek, width, startOffset = 0 }: WaveformProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Get waveform colors from CSS variables (theme-aware)
  const waveformColor = getComputedStyle(document.documentElement).getPropertyValue('--waveform-color').trim();
  const waveformColorHSL = waveformColor ? `hsl(${waveformColor})` : "hsl(230, 20%, 25%)";

  const waveformBackground = getComputedStyle(document.documentElement).getPropertyValue('--waveform-background').trim();
  const waveformBackgroundHSL = waveformBackground ? `hsl(${waveformBackground})` : "hsl(230, 30%, 10%)";

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

  // Listen to user interactions (clicks/drags) on waveform
  useEffect(() => {
    if (!wavesurfer) return;

    let isDragging = false;

    // Fired continuously on drag, AND once on initial mousedown
    const handleInteraction = (newTime: number) => {
      onDragSeek?.(newTime);
    };

    const handleDragStart = () => {
      isDragging = true;
    };

    const handleDragEnd = () => {
      isDragging = false;
      const newTime = wavesurfer.getCurrentTime();
      onSeek?.(newTime);
    };

    const handleClick = () => {
      // Ignorer le clic s'il s'agit de la fin d'un glissement (drag)
      if (isDragging) return;

      const newTime = wavesurfer.getCurrentTime();
      onSeek?.(newTime);
    };

    wavesurfer.on('interaction', handleInteraction);
    wavesurfer.on('dragstart', handleDragStart);
    wavesurfer.on('dragend', handleDragEnd);
    wavesurfer.on('click', handleClick);

    return () => {
      wavesurfer.un('interaction', handleInteraction);
      wavesurfer.un('dragstart', handleDragStart);
      wavesurfer.un('dragend', handleDragEnd);
      wavesurfer.un('click', handleClick);
    };
  }, [wavesurfer, onSeek, onDragSeek]);

  return (
    <div className="w-full h-[100px] rounded-lg overflow-hidden relative" style={{ backgroundColor: waveformBackgroundHSL }}>
      <div
        ref={containerRef}
        className="h-full"
        style={{
          width: width ? `${width}px` : '100%',
          marginLeft: `${startOffset}px`,
          cursor: "url('/assets/cursors/line_vertical.svg') 16 16, text"
        }}
      />
      {!isReady && audioUrl && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: waveformBackgroundHSL }}>
          <p className="text-sm text-muted-foreground">Chargement de la forme d'onde...</p>
        </div>
      )}
    </div>
  );
};

