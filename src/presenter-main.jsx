import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Timer component
function PresenterTimer({ startTime }) {
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    if (!startTime) return;
    
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [startTime]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  const formatTime = () => {
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="text-4xl font-mono font-bold text-white">
      {startTime ? formatTime() : '--:--'}
    </div>
  );
}

// Full presenter view
function PresenterView() {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [totalSlides, setTotalSlides] = React.useState(0);
  const [status, setStatus] = React.useState('Waiting for main window...');
  const [slides, setSlides] = React.useState([]);
  const [loadError, setLoadError] = React.useState(null);
  const [modules, setModules] = React.useState(null);
  const [currentDeckId, setCurrentDeckId] = React.useState(null);
  const [presentationStartTime, setPresentationStartTime] = React.useState(null);
  const [currentNotes, setCurrentNotes] = React.useState('');
  const [jokes, setJokes] = React.useState([]);

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
        console.error('[Presenter] Module import error:', err);
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
        const deckModule = await import(`./decks/${currentDeckId}/index.js`);
        const deck = deckModule.default;
        const loadedSlides = modules.processDeck(deck.config, deck.mdxModules);
        setSlides(loadedSlides);
        setStatus(`Loaded ${loadedSlides.length} slides`);
        setLoadError(null);
      } catch (err) {
        console.error('[Presenter] Deck load error:', err);
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
        setTotalSlides(event.data.totalSlides);
        setPresentationStartTime(event.data.presentationStartTime);
        setCurrentNotes(event.data.currentSlide?.notes || '');
        setJokes(event.data.jokes || []);
        
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

  // Navigation handlers
  const navigateNext = () => {
    window.opener?.postMessage({ type: 'NAVIGATE_NEXT' }, '*');
  };
  
  const navigatePrev = () => {
    window.opener?.postMessage({ type: 'NAVIGATE_PREV' }, '*');
  };

  const triggerJoke = (hotkey) => {
    window.opener?.postMessage({ type: 'TRIGGER_JOKE', hotkey }, '*');
  };

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
  const nextSlide = slides[currentIndex + 1];

  // Loading/error state
  if (slides.length === 0) {
    return (
      <div className="w-screen h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">📡</div>
          <p className="text-xl mb-2">{status}</p>
          {loadError && <p className="text-red-400 mt-2">{loadError}</p>}
          <p className="text-xs text-gray-500 mt-4">
            window.opener: {window.opener ? '✅' : '❌'}
          </p>
        </div>
      </div>
    );
  }

  // Full presenter layout
  return (
    <div className="w-screen h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Top bar - Timer and slide counter */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <span className="text-green-400 text-lg">●</span>
          <span className="text-xl font-semibold">
            Slide {currentIndex + 1} of {totalSlides || slides.length}
          </span>
        </div>
        <PresenterTimer startTime={presentationStartTime} />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Current slide + Notes */}
        <div className="flex-1 flex flex-col p-4 gap-4">
          {/* Current slide preview */}
          <div className="flex-1 bg-black rounded-xl overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full transform scale-[0.85]">
                {currentSlide && renderSlide(currentSlide)}
              </div>
            </div>
            <div className="absolute top-3 left-3 px-2 py-1 bg-purple-600 rounded text-xs font-semibold">
              CURRENT
            </div>
          </div>

          {/* Notes section */}
          <div className="h-48 bg-gray-800 rounded-xl p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Speaker Notes
            </h3>
            {currentNotes ? (
              <p className="text-lg leading-relaxed whitespace-pre-wrap">{currentNotes}</p>
            ) : (
              <p className="text-gray-500 italic">No notes for this slide</p>
            )}
          </div>
        </div>

        {/* Right panel - Next slide + Controls */}
        <div className="w-80 flex flex-col p-4 gap-4 border-l border-gray-700">
          {/* Next slide preview */}
          <div className="h-64 bg-black rounded-xl overflow-hidden relative">
            {nextSlide ? (
              <>
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                  <div className="w-[250%] h-[250%] flex items-center justify-center" style={{ transform: 'scale(0.4)' }}>
                    {renderSlide(nextSlide)}
                  </div>
                </div>
                <div className="absolute top-2 left-2 px-2 py-1 bg-gray-600 rounded text-xs font-semibold">
                  NEXT
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                End of presentation
              </div>
            )}
          </div>

          {/* Navigation controls */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Navigation
            </h3>
            <div className="flex gap-2">
              <button
                onClick={navigatePrev}
                disabled={currentIndex === 0}
                className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={navigateNext}
                disabled={currentIndex >= slides.length - 1}
                className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Joke triggers */}
          <div className="flex-1 bg-gray-800 rounded-xl p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span>🎭</span> Joke Panel
            </h3>
            {jokes.length > 0 ? (
              <div className="space-y-2">
                {jokes.map((joke) => (
                  <button
                    key={joke.id}
                    onClick={() => triggerJoke(joke.hotkey)}
                    className="w-full py-2 px-3 bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 rounded-lg text-left flex items-center gap-3 transition-all shadow-md hover:shadow-lg"
                  >
                    <span className="w-8 h-8 bg-white/20 rounded flex items-center justify-center font-mono font-bold text-white">
                      {joke.hotkey}
                    </span>
                    <span className="text-sm font-medium truncate">{joke.id}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">No jokes configured for this deck</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('presenter-root')).render(
  <React.StrictMode>
    <PresenterView />
  </React.StrictMode>,
);
