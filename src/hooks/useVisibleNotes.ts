import { useState, useEffect, useCallback, useRef } from 'react';
import { Note } from '@/types/note';

interface UseVisibleNotesOptions {
  notes: Note[];
  cellWidth: number;
  startOffset: number;
  containerRef: React.RefObject<HTMLElement>;
  bufferSize?: number; // Buffer size in pixels (default: 300)
}

/**
 * Hook to calculate which notes are visible in the viewport + buffer zone
 * Optimizes rendering by only showing notes that are in or near the visible area
 */
export const useVisibleNotes = ({
  notes,
  cellWidth,
  startOffset,
  containerRef,
  bufferSize = 300,
}: UseVisibleNotesOptions): Set<string> => {
  const [visibleNoteIds, setVisibleNoteIds] = useState<Set<string>>(new Set());
  const rafIdRef = useRef<number | null>(null);
  const lastScrollLeftRef = useRef<number>(0);

  const updateVisibleNotes = useCallback(() => {
    if (!containerRef.current) {
      // If no container, show all notes
      setVisibleNoteIds(new Set(notes.map(n => n.id)));
      return;
    }

    const container = containerRef.current;
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;

    // Calculate visible range in pixels (relative to the grid)
    const visibleStartPx = scrollLeft - startOffset - bufferSize;
    const visibleEndPx = scrollLeft + containerWidth - startOffset + bufferSize;

    // Convert to cell positions
    const visibleStartCell = Math.floor(visibleStartPx / cellWidth);
    const visibleEndCell = Math.ceil(visibleEndPx / cellWidth);

    // Filter notes that intersect with visible range
    const visible = new Set<string>();
    notes.forEach(note => {
      const noteEndCell = note.gridPosition + note.gridWidth;
      
      // Check if note intersects with visible range
      if (note.gridPosition <= visibleEndCell && noteEndCell >= visibleStartCell) {
        visible.add(note.id);
      }
    });

    setVisibleNoteIds(visible);
  }, [notes, cellWidth, startOffset, containerRef, bufferSize]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial calculation
    updateVisibleNotes();
    lastScrollLeftRef.current = container.scrollLeft;

    // Listen to scroll events with throttling via RAF
    const handleScroll = () => {
      const currentScrollLeft = container.scrollLeft;
      
      // Only update if horizontal scroll changed significantly (more than 20px)
      if (Math.abs(currentScrollLeft - lastScrollLeftRef.current) < 20) {
        return;
      }
      
      lastScrollLeftRef.current = currentScrollLeft;
      
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      
      rafIdRef.current = requestAnimationFrame(() => {
        updateVisibleNotes();
        rafIdRef.current = null;
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    // Also update on resize
    const resizeObserver = new ResizeObserver(() => {
      updateVisibleNotes();
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [updateVisibleNotes, containerRef]);

  // Update when notes change
  useEffect(() => {
    updateVisibleNotes();
  }, [updateVisibleNotes]);

  return visibleNoteIds;
};
