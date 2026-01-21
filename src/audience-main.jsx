import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import JokeOverlay from './components/JokeOverlay';

// Audience/Stage View - Clean slide display for projector/external display
function AudienceView() {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [status, setStatus] = React.useState('Waiting for presenter...');
  const [slides, setSlides] = React.useState([]);
  const [loadError, setLoadError] = React.useState(null);
  const [modules, setModules] = React.useState(null);
  const [currentDeckId, setCurrentDeckId] = React.useState(null);
  const [currentJoke, setCurrentJoke] = React.useState(null);

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

  // Load deck when deckId changes
  React.useEffect(() => {
    if (!modules || !currentDeckId) return;
    
    async function loadDeck() {
      try {
        setStatus(`Loading deck...`);
        const deckModule = await import(`./decks/${currentDeckId}/index.js`);
        const deck = deckModule.default;
        const loadedSlides = modules.processDeck(deck.config, deck.mdxModules);
        setSlides(loadedSlides);
        setStatus('');
        setLoadError(null);
      } catch (err) {
        console.error('[Audience] Deck load error:', err);
        setLoadError(`Deck error: ${err.message}`);
        setStatus('Failed to load deck');
      }
    }
    loadDeck();
  }, [modules, currentDeckId]);

  // Listen for messages from presenter (main window)
  React.useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'SLIDE_STATE') {
        setCurrentIndex(event.data.currentIndex);
        
        if (event.data.deckId && event.data.deckId !== currentDeckId) {
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

  // Clean slide view - no chrome, just the slide
  return (
    <div className="w-screen h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center overflow-hidden">
      {currentSlide && renderSlide(currentSlide)}
      <JokeOverlay joke={currentJoke} onDismiss={() => setCurrentJoke(null)} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('audience-root')).render(
  <React.StrictMode>
    <AudienceView />
  </React.StrictMode>,
);
