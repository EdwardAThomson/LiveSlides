import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// V9: Sync deck from main window
function PresenterV9() {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [status, setStatus] = React.useState('Waiting for main window...');
  const [slides, setSlides] = React.useState([]);
  const [loadError, setLoadError] = React.useState(null);
  const [modules, setModules] = React.useState(null);
  const [currentDeckId, setCurrentDeckId] = React.useState(null);

  // Load base modules on mount
  React.useEffect(() => {
    async function loadModules() {
      try {
        setStatus('Loading modules...');
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
        setStatus('Waiting for deck from main window...');
      } catch (err) {
        console.error('[PresenterV9] Module import error:', err);
        setLoadError(`Import error: ${err.message}`);
        setStatus('Failed to load modules');
      }
    }
    loadModules();
  }, []);

  // Load deck when deckId changes
  React.useEffect(() => {
    if (!modules || !currentDeckId) return;
    
    async function loadDeck() {
      try {
        setStatus(`Loading deck: ${currentDeckId}...`);
        // Dynamic import based on deckId
        const deckModule = await import(`./decks/${currentDeckId}/index.js`);
        const deck = deckModule.default;
        const loadedSlides = modules.processDeck(deck.config, deck.mdxModules);
        setSlides(loadedSlides);
        setStatus(`Loaded ${loadedSlides.length} slides`);
        setLoadError(null);
      } catch (err) {
        console.error('[PresenterV9] Deck load error:', err);
        setLoadError(`Deck error: ${err.message}`);
        setStatus('Failed to load deck');
      }
    }
    loadDeck();
  }, [modules, currentDeckId]);

  // Listen for messages from main window
  React.useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'SLIDE_STATE') {
        setCurrentIndex(event.data.currentIndex);
        // Update deck if changed
        if (event.data.deckId && event.data.deckId !== currentDeckId) {
          setCurrentDeckId(event.data.deckId);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    if (window.opener) {
      window.opener.postMessage({ type: 'PRESENTER_READY' }, '*');
    }
    
    const interval = setInterval(() => {
      if (window.opener && slides.length === 0) {
        window.opener.postMessage({ type: 'PRESENTER_READY' }, '*');
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
      <div style={{ 
        width: '100vw', height: '100vh', 
        backgroundColor: '#111827', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📡</div>
          <p style={{ fontSize: '20px', marginBottom: '8px' }}>{status}</p>
          {loadError && <p style={{ color: '#f87171', marginTop: '8px' }}>{loadError}</p>}
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '16px' }}>
            window.opener: {window.opener ? '✅' : '❌'}
          </p>
        </div>
      </div>
    );
  }

  // Main slide view
  return (
    <div className="w-screen h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center overflow-hidden">
      {currentSlide && renderSlide(currentSlide)}
      
      {/* Status bar */}
      <div className="absolute bottom-4 left-4 px-3 py-2 bg-black/70 rounded-lg text-sm flex items-center gap-3">
        <span className="text-green-400">●</span>
        <span>Slide {currentIndex + 1} / {slides.length}</span>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('presenter-root')).render(
  <React.StrictMode>
    <PresenterV9 />
  </React.StrictMode>,
);
