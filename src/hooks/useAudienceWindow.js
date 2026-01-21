import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to manage audience/stage window and postMessage communication
 * The audience window shows clean slides for projector/external display
 * 
 * @param {object} options - Configuration options
 * @param {number} options.currentIndex - Current slide index
 * @param {number} options.totalSlides - Total number of slides
 * @param {object} options.currentSlide - Current slide data
 * @param {array} options.slides - All slides
 * @param {object} options.jokesConfig - Jokes configuration
 * @param {function} options.onTriggerJoke - Trigger a joke by hotkey
 */
export default function useAudienceWindow({
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
  const [audienceWindow, setAudienceWindow] = useState(null);
  const [isAudienceOpen, setIsAudienceOpen] = useState(false);
  const [presentationStartTime, setPresentationStartTime] = useState(null);
  const lastSentState = useRef(null);

  // Open audience/stage window
  const openAudienceWindow = useCallback(() => {
    if (audienceWindow && !audienceWindow.closed) {
      audienceWindow.focus();
      return;
    }

    const width = 1200;
    const height = 800;
    const left = window.screen.width - width - 50;
    const top = 50;

    const newWindow = window.open(
      '/audience.html',
      'LiveSlides Stage',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (newWindow) {
      setAudienceWindow(newWindow);
      setIsAudienceOpen(true);
      setPresentationStartTime(Date.now());
    }
  }, [audienceWindow]);

  // Close audience window
  const closeAudienceWindow = useCallback(() => {
    if (audienceWindow && !audienceWindow.closed) {
      audienceWindow.close();
    }
    setAudienceWindow(null);
    setIsAudienceOpen(false);
  }, [audienceWindow]);

  // Toggle audience window
  const toggleAudienceWindow = useCallback(() => {
    if (isAudienceOpen && audienceWindow && !audienceWindow.closed) {
      closeAudienceWindow();
    } else {
      openAudienceWindow();
    }
  }, [isAudienceOpen, audienceWindow, openAudienceWindow, closeAudienceWindow]);

  // Send state to audience window
  const sendStateToAudience = useCallback(() => {
    if (!audienceWindow || audienceWindow.closed) return;

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
      console.log('[Presenter] Sending state to audience:', { currentIndex, totalSlides, deckId });
      audienceWindow.postMessage(state, '*');
    } catch (e) {
      console.error('[Presenter] Failed to send state to audience window:', e);
    }
  }, [audienceWindow, currentIndex, totalSlides, currentSlide, slides, jokesConfig, presentationStartTime, deckId]);

  // Handle messages from audience window
  useEffect(() => {
    const handleMessage = (event) => {
      if (!event.data || typeof event.data !== 'object') return;

      const { type } = event.data;

      switch (type) {
        case 'AUDIENCE_READY':
          // Audience window is ready, send initial state
          console.log('[Presenter] Received AUDIENCE_READY, sending state...');
          lastSentState.current = null; // Clear cache to force re-send
          sendStateToAudience();
          break;
        case 'TRIGGER_JOKE':
          onTriggerJoke?.(event.data.hotkey);
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onTriggerJoke, sendStateToAudience]);

  // Send state updates to audience window
  useEffect(() => {
    sendStateToAudience();
  }, [sendStateToAudience]);

  // Check if audience window was closed
  useEffect(() => {
    if (!audienceWindow) return;

    const checkWindow = setInterval(() => {
      if (audienceWindow.closed) {
        setAudienceWindow(null);
        setIsAudienceOpen(false);
      }
    }, 1000);

    return () => clearInterval(checkWindow);
  }, [audienceWindow]);

  // Send joke to audience window
  const sendJokeToAudience = useCallback((joke) => {
    if (!audienceWindow || audienceWindow.closed) return;
    try {
      audienceWindow.postMessage({ type: 'SHOW_JOKE', joke }, '*');
    } catch (e) {
      console.error('[Presenter] Failed to send joke to audience:', e);
    }
  }, [audienceWindow]);

  // Dismiss joke in audience window
  const dismissJokeInAudience = useCallback(() => {
    if (!audienceWindow || audienceWindow.closed) return;
    try {
      audienceWindow.postMessage({ type: 'DISMISS_JOKE' }, '*');
    } catch (e) {
      console.error('[Presenter] Failed to dismiss joke in audience:', e);
    }
  }, [audienceWindow]);

  return {
    isAudienceOpen,
    openAudienceWindow,
    closeAudienceWindow,
    toggleAudienceWindow,
    presentationStartTime,
    sendJokeToAudience,
    dismissJokeInAudience,
  };
}
