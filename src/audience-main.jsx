import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import JokeOverlay from './components/JokeOverlay';
import SlideChrome from './components/SlideChrome';

// Check if running in Tauri
const isTauri = () => typeof window !== 'undefined' && window.__TAURI_INTERNALS__;

// Audience/Stage View - Clean slide display for projector/external display
function AudienceView() {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [status, setStatus] = React.useState('Waiting for presenter...');
  const [slides, setSlides] = React.useState([]);
  const [loadError, setLoadError] = React.useState(null);
  const [modules, setModules] = React.useState(null);
  const [currentDeckId, setCurrentDeckId] = React.useState(null);
  const [currentJoke, setCurrentJoke] = React.useState(null);
  const [cameraOverlayVisible, setCameraOverlayVisible] = React.useState(true);
  const [cameraOverlay, setCameraOverlay] = React.useState(null);
  const [totalSlides, setTotalSlides] = React.useState(0);
  const currentDeckIdRef = React.useRef(null);

  // Load base modules on mount
  React.useEffect(() => {
    async function loadModules() {
      try {
        setStatus('Loading...');
        const [ts, is, ys, ifs, ms, dl] = await Promise.all([
          import('./components/slides/TextSlide'),
          import('./components/slides/ImageSlide'),
          import('./components/slides/YouTubeSlide'),
          import('./components/slides/IframeSlide'),
          import('./components/slides/MDXSlide'),
          import('./lib/deckLoader'),
        ]);
        setModules({
          TextSlide: ts.default,
          ImageSlide: is.default,
          YouTubeSlide: ys.default,
          IframeSlide: ifs.default,
          MDXSlide: ms.default,
          processDeck: dl.processDeck,
        });
        setStatus('Waiting for presenter...');
      } catch (err) {
        console.error('[Audience] Module import error:', err);
        setLoadError(`Import error: ${err.message}`);
        setStatus('Failed to load');
      }
    }
    loadModules();
  }, []);

  // Track if current deck is external (loaded via externalSlides)
  const [isExternalDeck, setIsExternalDeck] = React.useState(false);

  // Load deck when deckId changes (bundled decks only)
  React.useEffect(() => {
    if (!modules || !currentDeckId) return;
    // Skip loading if this is an external deck - slides come via message
    if (isExternalDeck) {
      console.log('[Audience] Skipping deck load - external deck');
      return;
    }
    
    async function loadDeck() {
      try {
        setStatus(`Loading deck...`);
        const deckModule = await import(`./decks/${currentDeckId}/index.js`);
        const deck = deckModule.default;
        const loadedSlides = modules.processDeck(deck.config, deck.mdxModules);
        setSlides(loadedSlides);
        setTotalSlides(loadedSlides.length);
        setCameraOverlay(deck.config.cameraOverlay || null);
        setStatus('');
        setLoadError(null);
      } catch (err) {
        console.error('[Audience] Deck load error:', err);
        setLoadError(`Deck error: ${err.message}`);
        setStatus('Failed to load deck');
      }
    }
    loadDeck();
  }, [modules, currentDeckId, isExternalDeck]);

  // Keep ref in sync for Tauri event handlers
  React.useEffect(() => {
    currentDeckIdRef.current = currentDeckId;
  }, [currentDeckId]);

  // Listen for messages from presenter (main window) - Tauri mode
  React.useEffect(() => {
    if (!isTauri()) return;

    let unlistenSlideState = null;
    let unlistenShowJoke = null;
    let unlistenDismissJoke = null;

    async function setupTauriListeners() {
      try {
        const { listen, emit } = await import('@tauri-apps/api/event');

        // Listen for slide state updates
        unlistenSlideState = await listen('slide-state', (event) => {
          const data = event.payload;
          console.log('[Tauri Audience] Received slide-state:', data);
          setCurrentIndex(data.currentIndex);
          
          // Handle external decks - receive slides directly
          if (data.isExternalDeck && data.externalSlides) {
            console.log('[Tauri Audience] External deck with', data.externalSlides.length, 'slides');
            setIsExternalDeck(true);
            // Convert serialized slides to renderable format (use 'text' type with HTML)
            const renderableSlides = data.externalSlides.map(slide => ({
              ...slide,
              // External MDX slides were converted to HTML, render as text slides
              type: slide.type === 'mdx' ? 'text' : slide.type,
              html: slide.html || `<div class="prose prose-invert max-w-4xl mx-auto p-8">${slide.notes || ''}</div>`,
            }));
            setSlides(renderableSlides);
            setTotalSlides(renderableSlides.length);
            setStatus('');
          } else if (data.deckId && data.deckId !== currentDeckIdRef.current) {
            setIsExternalDeck(false);
            setCurrentDeckId(data.deckId);
          }
        });

        // Listen for joke events
        unlistenShowJoke = await listen('show-joke', (event) => {
          console.log('[Tauri Audience] Received show-joke');
          setCurrentJoke(event.payload.joke);
        });

        unlistenDismissJoke = await listen('dismiss-joke', () => {
          console.log('[Tauri Audience] Received dismiss-joke');
          setCurrentJoke(null);
        });

        // Tell presenter we're ready
        console.log('[Tauri Audience] Emitting audience-ready');
        await emit('audience-ready', {});

      } catch (e) {
        console.error('[Tauri Audience] Error setting up listeners:', e);
      }
    }

    setupTauriListeners();

    return () => {
      unlistenSlideState?.();
      unlistenShowJoke?.();
      unlistenDismissJoke?.();
    };
  }, []);

  // Listen for messages from presenter (main window) - Web mode
  React.useEffect(() => {
    if (isTauri()) return;

    const handleMessage = (event) => {
      if (event.data?.type === 'SLIDE_STATE') {
        setCurrentIndex(event.data.currentIndex);
        
        // Handle external decks - receive slides directly
        if (event.data.isExternalDeck && event.data.externalSlides) {
          console.log('[Web Audience] External deck with', event.data.externalSlides.length, 'slides');
          setIsExternalDeck(true);
          const renderableSlides = event.data.externalSlides.map(slide => ({
            ...slide,
            type: slide.type === 'mdx' ? 'text' : slide.type,
            html: slide.html || `<div class="prose prose-invert max-w-4xl mx-auto p-8">${slide.notes || ''}</div>`,
          }));
          setSlides(renderableSlides);
          setTotalSlides(renderableSlides.length);
          setStatus('');
        } else if (event.data.deckId && event.data.deckId !== currentDeckId) {
          setIsExternalDeck(false);
          setCurrentDeckId(event.data.deckId);
        }
      } else if (event.data?.type === 'SHOW_JOKE') {
        setCurrentJoke(event.data.joke);
      } else if (event.data?.type === 'DISMISS_JOKE') {
        setCurrentJoke(null);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Tell presenter we're ready
    if (window.opener) {
      window.opener.postMessage({ type: 'AUDIENCE_READY' }, '*');
    }
    
    // Keep pinging until we get slides
    const interval = setInterval(() => {
      if (window.opener && slides.length === 0) {
        window.opener.postMessage({ type: 'AUDIENCE_READY' }, '*');
      }
    }, 1000);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, [slides.length, currentDeckId]);

  // Render slide
  const renderSlide = (slide) => {
    if (!slide || !modules) return null;
    
    const { TextSlide, ImageSlide, YouTubeSlide, IframeSlide, MDXSlide } = modules;
    
    switch (slide.type) {
      case 'text':
        // Check if html is a string (external deck) or object (bundled deck)
        if (typeof slide.html === 'string') {
          return (
            <div 
              className="max-w-5xl mx-auto px-8 text-white"
              dangerouslySetInnerHTML={{ __html: slide.html }}
            />
          );
        }
        return <TextSlide html={slide.html} />;
      case 'image':
        return <ImageSlide src={slide.src} alt={slide.alt} />;
      case 'youtube':
        return <YouTubeSlide youtubeId={slide.youtubeId} start={slide.start} />;
      case 'iframe':
        return <IframeSlide src={slide.src} />;
      case 'mdx':
        return <MDXSlide Component={slide.Component} layout={slide.layout} />;
      default:
        return <div className="text-white text-center">Unknown slide type: {slide.type}</div>;
    }
  };

  const currentSlide = slides[currentIndex];

  // Loading/error state
  if (slides.length === 0) {
    return (
      <div className="w-screen h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">📺</div>
          <p className="text-2xl mb-2">{status}</p>
          {loadError && <p className="text-red-400 mt-2">{loadError}</p>}
        </div>
      </div>
    );
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // Stage view with controls
  return (
    <SlideChrome
      currentIndex={currentIndex}
      totalSlides={totalSlides || slides.length}
      onPrev={() => {}} // Navigation controlled by presenter
      onNext={() => {}}
      onToggleFullscreen={toggleFullscreen}
      onToggleCameraOverlay={() => setCameraOverlayVisible(!cameraOverlayVisible)}
      canGoPrev={currentIndex > 0}
      canGoNext={currentIndex < slides.length - 1}
      cameraOverlay={cameraOverlay}
      cameraOverlayVisible={cameraOverlayVisible}
    >
      {currentSlide && renderSlide(currentSlide)}
      <JokeOverlay joke={currentJoke} onDismiss={() => setCurrentJoke(null)} />
    </SlideChrome>
  );
}

ReactDOM.createRoot(document.getElementById('audience-root')).render(
  <React.StrictMode>
    <AudienceView />
  </React.StrictMode>,
);
