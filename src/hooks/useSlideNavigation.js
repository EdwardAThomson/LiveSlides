import { useState, useCallback, useEffect } from 'react';

export default function useSlideNavigation(totalSlides, resetKey) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Reset to 0 when resetKey changes (e.g., deck switch)
  useEffect(() => {
    setCurrentIndex(0);
  }, [resetKey]);

  const next = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalSlides - 1));
  }, [totalSlides]);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goTo = useCallback((index) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentIndex(index);
    }
  }, [totalSlides]);

  const canGoNext = currentIndex < totalSlides - 1;
  const canGoPrev = currentIndex > 0;

  return {
    currentIndex,
    totalSlides,
    next,
    prev,
    goTo,
    canGoNext,
    canGoPrev,
  };
}
