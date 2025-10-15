import { useCallback } from 'react';

/**
 * Hook that provides slide navigation logic without managing state
 * State is managed by the parent component for better control
 */
export default function useSlideNavigation(currentIndex, setCurrentIndex, totalSlides) {
  const next = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalSlides - 1));
  }, [setCurrentIndex, totalSlides]);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, [setCurrentIndex]);

  const goTo = useCallback((index) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentIndex(index);
    }
  }, [setCurrentIndex, totalSlides]);

  const canGoNext = currentIndex < totalSlides - 1;
  const canGoPrev = currentIndex > 0;

  return {
    next,
    prev,
    goTo,
    canGoNext,
    canGoPrev,
  };
}
