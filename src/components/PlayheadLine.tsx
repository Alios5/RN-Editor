import { memo } from 'react';
import { timeToPixelPosition } from '@/utils/gridPositionCalculator';

interface PlayheadLineProps {
  currentTime: number;
  audioDuration: number;
  waveformWidth: number;
  startOffset?: number;
  bpm: number;
  subRhythmSync: number;
}

export const PlayheadLine = memo(({
  currentTime,
  audioDuration,
  waveformWidth,
  startOffset = 0,
  bpm,
  subRhythmSync
}: PlayheadLineProps) => {
  // Calculate line position using BPM-based precision (no drift accumulation)
  const position = audioDuration > 0
    ? timeToPixelPosition(currentTime, bpm, subRhythmSync) + startOffset
    : startOffset;

  return (
    <div
      className="absolute top-0 w-0.5 pointer-events-none"
      style={{
        left: `${position}px`,
        height: '100%',
        minHeight: '100%',
        zIndex: 50,
        backgroundColor: 'hsl(var(--playhead-line))',
      }}
    >
      {/* Triangle indicator at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full">
        <div
          className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px]"
          style={{ borderTopColor: 'hsl(var(--playhead-line))' }}
        />
      </div>
    </div>
  );
});
