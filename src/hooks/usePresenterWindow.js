import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to manage presenter window and postMessage communication
 * 
 * @param {object} options - Configuration options
 * @param {number} options.currentIndex - Current slide index
 * @param {number} options.totalSlides - Total number of slides
 * @param {object} options.currentSlide - Current slide data
 * @param {array} options.slides - All slides
 * @param {object} options.jokesConfig - Jokes configuration
 * @param {function} options.onNext - Navigate to next slide
 * @param {function} options.onPrev - Navigate to previous slide
 * @param {function} options.onGoTo - Navigate to specific slide
 * @param {function} options.onTriggerJoke - Trigger a joke by hotkey
 */
export default function usePresenterWindow({
  currentIndex,
  totalSlides,
  currentSlide,
  slides,
  jokesConfig,
  deckId,
  onNext,
  onPrev,
  onGoTo,
  onTriggerJoke,
}) {
  const [presenterWindow, setPresenterWindow] = useState(null);
  const [isPresenterOpen, setIsPresenterOpen] = useState(false);
  const [presentationStartTime, setPresentationStartTime] = useState(null);
  const lastSentState = useRef(null);

  // Open presenter window
  const openPresenterWindow = useCallback(() => {
    if (presenterWindow && !presenterWindow.closed) {
      presenterWindow.focus();
      return;
    }

    const width = 1200;
    const height = 800;
    const left = window.screen.width - width - 50;
    const top = 50;

    const newWindow = window.open(
      '/presenter.html',
      'LiveSlides Presenter',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (newWindow) {
      setPresenterWindow(newWindow);
      setIsPresenterOpen(true);
      setPresentationStartTime(Date.now());
    }
  }, [presenterWindow]);

  // Close presenter window
  const closePresenterWindow = useCallback(() => {
    if (presenterWindow && !presenterWindow.closed) {
      presenterWindow.close();
    }
    setPresenterWindow(null);
    setIsPresenterOpen(false);
  }, [presenterWindow]);

  // Toggle presenter window
  const togglePresenterWindow = useCallback(() => {
    if (isPresenterOpen && presenterWindow && !presenterWindow.closed) {
      closePresenterWindow();
    } else {
      openPresenterWindow();
    }
  }, [isPresenterOpen, presenterWindow, openPresenterWindow, closePresenterWindow]);

  // Send state to presenter window
  const sendStateToPresenter = useCallback(() => {
    if (!presenterWindow || presenterWindow.closed) return;

    const nextSlide = slides[currentIndex + 1] || null;
    
    // Extract only serializable properties (exclude React components)
    const serializeSlide = (slide) => {
      if (!slide) return null;
      return {
        id: slide.id,
        type: slide.type,
        layout: slide.layout,
        notes: slide.notes || slide.frontmatter?.notes || '',
        // Frontmatter for MDX slides
        title: slide.frontmatter?.title || slide.title,
        subtitle: slide.frontmatter?.subtitle,
        frontmatter: slide.frontmatter ? { ...slide.frontmatter } : null,
        // Type-specific data
        html: slide.html,
        src: slide.src,
        alt: slide.alt,
        youtubeId: slide.youtubeId,
        start: slide.start,
      };
    };

    const state = {
      type: 'SLIDE_STATE',
      currentIndex,
      totalSlides,
      currentSlide: serializeSlide(currentSlide),
      nextSlide: serializeSlide(nextSlide),
      jokes: jokesConfig?.jokes || [],
      presentationStartTime,
      deckId, // For presenter to load correct deck
    };

    // Avoid sending duplicate state
    const stateKey = JSON.stringify({ currentIndex, totalSlides, deckId });
    if (lastSentState.current === stateKey) return;
    lastSentState.current = stateKey;

    try {
      console.log('[Main] Sending state to presenter:', { currentIndex, totalSlides, deckId });
      presenterWindow.postMessage(state, '*');
    } catch (e) {
      console.error('[Main] Failed to send state to presenter window:', e);
    }
  }, [presenterWindow, currentIndex, totalSlides, currentSlide, slides, jokesConfig, presentationStartTime, deckId]);

  // Handle messages from presenter window
  useEffect(() => {
    const handleMessage = (event) => {
      // Basic origin check - in production you'd want stricter validation
      if (!event.data || typeof event.data !== 'object') return;

      const { type, ...payload } = event.data;

      switch (type) {
        case 'NAVIGATE_NEXT':
          onNext?.();
          break;
        case 'NAVIGATE_PREV':
          onPrev?.();
          break;
        case 'NAVIGATE_TO':
          onGoTo?.(payload.index);
          break;
        case 'TRIGGER_JOKE':
          onTriggerJoke?.(payload.hotkey);
          break;
        case 'PRESENTER_READY':
          // Presenter window is ready, force send initial state
          console.log('[Main] Received PRESENTER_READY, sending state...');
          lastSentState.current = null; // Clear cache to force re-send
          sendStateToPresenter();
          break;
        case 'RESET_TIMER':
          setPresentationStartTime(Date.now());
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onNext, onPrev, onGoTo, onTriggerJoke, sendStateToPresenter]);

  // Send state updates to presenter window
  useEffect(() => {
    sendStateToPresenter();
  }, [sendStateToPresenter]);

  // Check if presenter window was closed
  useEffect(() => {
    if (!presenterWindow) return;

    const checkWindow = setInterval(() => {
      if (presenterWindow.closed) {
        setPresenterWindow(null);
        setIsPresenterOpen(false);
      }
    }, 1000);

    return () => clearInterval(checkWindow);
  }, [presenterWindow]);

  return {
    isPresenterOpen,
    openPresenterWindow,
    closePresenterWindow,
    togglePresenterWindow,
    presentationStartTime,
  };
}
