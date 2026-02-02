import { useEffect, useRef } from 'react';

/**
 * Hook to track scroll position and update all track labels directly.
 * Uses requestAnimationFrame for smooth updates without jitter.
 */
export const useScrollPosition = (containerRef: React.RefObject<HTMLElement>) => {
  const rafIdRef = useRef<number | null>(null);
  const lastScrollLeftRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Cache label references for better performance
    let labelElements: HTMLElement[] = [];
    
    const updateLabelCache = () => {
      labelElements = Array.from(container.querySelectorAll<HTMLElement>('[data-track-label]'));
    };

    // Initial setup
    updateLabelCache();
    const initialScroll = container.scrollLeft;
    labelElements.forEach(label => {
      label.style.transform = `translateX(${initialScroll}px)`;
    });
    lastScrollLeftRef.current = initialScroll;

    // MutationObserver to update cache when tracks are added/removed
    const observer = new MutationObserver(updateLabelCache);
    observer.observe(container, { childList: true, subtree: true });

    const handleScroll = () => {
      const currentScrollLeft = container.scrollLeft;
      
      // Only update if horizontal scroll changed
      if (currentScrollLeft === lastScrollLeftRef.current) {
        return;
      }
      
      lastScrollLeftRef.current = currentScrollLeft;
      
      // Cancel any pending RAF
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      
      // Schedule update on next animation frame for smooth rendering
      rafIdRef.current = requestAnimationFrame(() => {
        const scrollValue = `translateX(${currentScrollLeft}px)`;
        labelElements.forEach(label => {
          label.style.transform = scrollValue;
        });
        rafIdRef.current = null;
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      observer.disconnect();
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [containerRef]);
};
