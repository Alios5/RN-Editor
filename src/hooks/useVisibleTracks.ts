import { useState, useEffect, useCallback, useRef } from 'react';
import { Track } from '@/types/track';

interface UseVisibleTracksOptions {
  tracks: Track[];
  scrollContainerRef: React.RefObject<HTMLElement>;
  trackHeight?: number; // Approximate height of one track in pixels (default: 131px)
  bufferSize?: number; // Buffer size in pixels (default: 300)
}

/**
 * Hook to calculate which tracks are visible in the viewport + buffer zone
 * Optimizes rendering by only showing tracks that are in or near the visible area
 */
export const useVisibleTracks = ({
  tracks,
  scrollContainerRef,
  trackHeight = 131, // TrackLabel (35px + 8px mb) + RhythmGrid (80px) + space-y-2 (8px)
  bufferSize = 300,
}: UseVisibleTracksOptions): Set<string> => {
  const [visibleTrackIds, setVisibleTrackIds] = useState<Set<string>>(new Set());
  const rafIdRef = useRef<number | null>(null);
  const lastScrollTopRef = useRef<number>(0);

  const updateVisibleTracks = useCallback(() => {
    if (!scrollContainerRef.current) {
      // If no container, show all tracks
      setVisibleTrackIds(new Set(tracks.map(t => t.id)));
      return;
    }

    const container = scrollContainerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    // Calculate visible range in pixels
    const visibleStartPx = scrollTop - bufferSize;
    const visibleEndPx = scrollTop + containerHeight + bufferSize;

    // Convert to track indices
    const visibleStartIndex = Math.max(0, Math.floor(visibleStartPx / trackHeight));
    const visibleEndIndex = Math.min(tracks.length - 1, Math.ceil(visibleEndPx / trackHeight));

    // Get IDs of visible tracks
    const visible = new Set<string>();
    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
      if (tracks[i]) {
        visible.add(tracks[i].id);
      }
    }

    setVisibleTrackIds(visible);
  }, [tracks, scrollContainerRef, trackHeight, bufferSize]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Initial calculation
    updateVisibleTracks();
    lastScrollTopRef.current = container.scrollTop;

    // Listen to scroll events with throttling via RAF
    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;
      
      // Only update if vertical scroll changed significantly (more than 10px)
      if (Math.abs(currentScrollTop - lastScrollTopRef.current) < 10) {
        return;
      }
      
      lastScrollTopRef.current = currentScrollTop;
      
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      
      rafIdRef.current = requestAnimationFrame(() => {
        updateVisibleTracks();
        rafIdRef.current = null;
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    // Also update on resize
    const resizeObserver = new ResizeObserver(() => {
      updateVisibleTracks();
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [updateVisibleTracks, scrollContainerRef]);

  // Update when tracks change
  useEffect(() => {
    updateVisibleTracks();
  }, [updateVisibleTracks]);

  return visibleTrackIds;
};
