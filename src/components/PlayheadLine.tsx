import { memo } from 'react';

interface PlayheadLineProps {
  currentTime: number;
  audioDuration: number;
  waveformWidth: number;
  startOffset?: number;
}

export const PlayheadLine = memo(({ 
  currentTime, 
  audioDuration, 
  waveformWidth,
  startOffset = 0
}: PlayheadLineProps) => {
  // Calculate line position based on current time, including startOffset
  const position = audioDuration > 0 
    ? ((currentTime / audioDuration) * waveformWidth) + startOffset 
    : startOffset;

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-blue-400 z-50 pointer-events-none"
      style={{ left: `${position}px` }}
    >
      {/* Triangle indicateur en haut */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full">
        <div 
          className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-blue-400"
        />
      </div>
    </div>
  );
});
