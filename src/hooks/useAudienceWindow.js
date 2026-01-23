import { useState, useEffect, useCallback, useRef } from 'react';

// Check if running in Tauri
const isTauri = () => typeof window !== 'undefined' && window.__TAURI_INTERNALS__;

/**
 * Hook to manage audience/stage window and postMessage communication
 * The audience window shows clean slides for projector/external display
 * Supports both web (window.open) and Tauri (WebviewWindow) modes
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
  cameraOverlayVisible,
  theme,
  onNext,
  onPrev,
  onGoTo,
  onTriggerJoke,
}) {
  const [audienceWindow, setAudienceWindow] = useState(null);
  const [isAudienceOpen, setIsAudienceOpen] = useState(false);
  const [presentationStartTime, setPresentationStartTime] = useState(null);
  const [tauriWindow, setTauriWindow] = useState(null);
  const lastSentState = useRef(null);
  const tauriUnlisten = useRef(null);

  // Open audience/stage window
  const openAudienceWindow = useCallback(async () => {
    // Tauri mode - use native WebviewWindow
    if (isTauri()) {
      // If already open, just focus
      if (tauriWindow) {
        try {
          await tauriWindow.setFocus();
        } catch (e) {
          console.log('[Tauri] Window may have been closed, creating new one');
          setTauriWindow(null);
        }
        if (tauriWindow) return;
      }

      try {
        const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
        const { listen } = await import('@tauri-apps/api/event');

        console.log('[Tauri] Creating audience window...');

        // Create new audience window
        const webview = new WebviewWindow('audience', {
          url: '/audience.html',
          title: 'LiveSlides - Stage View',
          width: 1200,
          height: 800,
          resizable: true,
        });

        webview.once('tauri://created', () => {
          console.log('[Tauri] Audience window created successfully');
          setTauriWindow(webview);
          setIsAudienceOpen(true);
          setPresentationStartTime(Date.now());
        });

        webview.once('tauri://error', (e) => {
          console.error('[Tauri] Failed to create audience window:', e);
        });

        // Listen for window destroy (after close completes)
        webview.once('tauri://destroyed', () => {
          console.log('[Tauri] Audience window destroyed');
          setTauriWindow(null);
          setIsAudienceOpen(false);
        });

        // Listen for audience ready event
        if (tauriUnlisten.current) {
          tauriUnlisten.current();
        }
        tauriUnlisten.current = await listen('audience-ready', () => {
          console.log('[Tauri] Audience window ready, sending state...');
          lastSentState.current = null; // Force re-send
        });

      } catch (e) {
        console.error('[Tauri] Error opening audience window:', e);
      }
      return;
    }

    // Web mode - use window.open
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
  const closeAudienceWindow = useCallback(async () => {
    // Tauri mode
    if (isTauri() && tauriWindow) {
      try {
        await tauriWindow.close();
      } catch (e) {
        console.error('[Tauri] Error closing audience window:', e);
      }
      setTauriWindow(null);
      setIsAudienceOpen(false);
      if (tauriUnlisten.current) {
        tauriUnlisten.current();
        tauriUnlisten.current = null;
      }
      return;
    }

    // Web mode
    if (audienceWindow && !audienceWindow.closed) {
      audienceWindow.close();
    }
    setAudienceWindow(null);
    setIsAudienceOpen(false);
  }, [audienceWindow, tauriWindow]);

  // Toggle audience window
  const toggleAudienceWindow = useCallback(() => {
    if (isAudienceOpen) {
      closeAudienceWindow();
    } else {
      openAudienceWindow();
    }
  }, [isAudienceOpen, openAudienceWindow, closeAudienceWindow]);

  // Send state to audience window
  const sendStateToAudience = useCallback(async () => {
    const nextSlide = slides[currentIndex + 1] || null;

    // Check if this is an external deck (ID is a UUID)
    const isExternalDeck = deckId && deckId.includes('-') && deckId.length > 30;

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
      deckId,
      cameraOverlayVisible,
      theme,
      // For external decks, send all serialized slides so audience can render them
      isExternalDeck,
      externalSlides: isExternalDeck ? slides.map(serializeSlide) : null,
    };

    // Avoid sending duplicate state
    const stateKey = JSON.stringify({ currentIndex, totalSlides, deckId, cameraOverlayVisible, theme });
    if (lastSentState.current === stateKey) return;
    lastSentState.current = stateKey;

    // Tauri mode - use events
    if (isTauri() && isAudienceOpen) {
      try {
        const { emit } = await import('@tauri-apps/api/event');
        console.log('[Tauri] Emitting slide-state:', { currentIndex, totalSlides, deckId });
        await emit('slide-state', state);
      } catch (e) {
        console.error('[Tauri] Failed to emit state:', e);
      }
      return;
    }

    // Web mode - use postMessage
    if (!audienceWindow || audienceWindow.closed) return;
    try {
      console.log('[Presenter] Sending state to audience:', { currentIndex, totalSlides, deckId });
      audienceWindow.postMessage(state, '*');
    } catch (e) {
      console.error('[Presenter] Failed to send state to audience window:', e);
    }
  }, [audienceWindow, isAudienceOpen, currentIndex, totalSlides, currentSlide, slides, jokesConfig, presentationStartTime, deckId, cameraOverlayVisible, theme]);

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
  const sendJokeToAudience = useCallback(async (joke) => {
    // Tauri mode
    if (isTauri() && isAudienceOpen) {
      try {
        const { emit } = await import('@tauri-apps/api/event');
        await emit('show-joke', { joke });
      } catch (e) {
        console.error('[Tauri] Failed to emit joke:', e);
      }
      return;
    }

    // Web mode
    if (!audienceWindow || audienceWindow.closed) return;
    try {
      audienceWindow.postMessage({ type: 'SHOW_JOKE', joke }, '*');
    } catch (e) {
      console.error('[Presenter] Failed to send joke to audience:', e);
    }
  }, [audienceWindow, isAudienceOpen]);

  // Dismiss joke in audience window
  const dismissJokeInAudience = useCallback(async () => {
    // Tauri mode
    if (isTauri() && isAudienceOpen) {
      try {
        const { emit } = await import('@tauri-apps/api/event');
        await emit('dismiss-joke', {});
      } catch (e) {
        console.error('[Tauri] Failed to emit dismiss joke:', e);
      }
      return;
    }

    // Web mode
    if (!audienceWindow || audienceWindow.closed) return;
    try {
      audienceWindow.postMessage({ type: 'DISMISS_JOKE' }, '*');
    } catch (e) {
      console.error('[Presenter] Failed to dismiss joke in audience:', e);
    }
  }, [audienceWindow, isAudienceOpen]);

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
