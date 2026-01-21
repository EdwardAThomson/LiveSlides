import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import SlideChrome from './components/SlideChrome';
import Transition from './components/Transition';
import TextSlide from './components/slides/TextSlide';
import ImageSlide from './components/slides/ImageSlide';
import YouTubeSlide from './components/slides/YouTubeSlide';
import IframeSlide from './components/slides/IframeSlide';
import MDXSlide from './components/slides/MDXSlide';
import JokeOverlay from './components/JokeOverlay';
import DeckSelector from './components/DeckSelector';
import useSlideNavigation from './hooks/useSlideNavigation';
import useKeyboardNav from './hooks/useKeyboardNav';
import useJokeManager from './hooks/useJokeManager';
import useAudienceWindow from './hooks/useAudienceWindow';
import PresenterTimer from './components/PresenterTimer';
import { processDeck } from './lib/deckLoader';
import myPresentation from './decks/my-presentation';
import demoDeck from './decks/demo-deck';
import quickDemo from './decks/quick-demo';
import vibeCoding from './decks/vibe-coding';
import aiFrameworks from './decks/ai-frameworks';


// Available decks configuration
const availableDecks = [
  {
    id: 'quick-demo',
    name: 'Quick Demo',
    icon: '⚡',
    description: 'Fast overview of features',
  },
  {
    id: 'vibe-coding',
    name: 'Vibe Coding Process',
    icon: '🤖',
    description: 'AI-assisted development workflow',
  },
  {
    id: 'my-presentation',
    name: 'My Presentation',
    icon: '📝',
    description: 'Custom presentation deck',
  },
  {
    id: 'demo-deck',
    name: 'MDX Examples',
    icon: '🎨',
    description: 'MDX components showcase',
  },
  {
    id: 'ai-frameworks',
    name: 'AI Frameworks',
    icon: '🤖',
    description: 'AI Opportunity & Risk Management',
  },
];

function App() {
  const [currentDeck, setCurrentDeck] = useState('quick-demo'); // Start with quick-demo
  const [slides, setSlides] = useState([]); // Initialize empty, will load from deck
  const [jokesConfig, setJokesConfig] = useState(null);
  const [cameraOverlay, setCameraOverlay] = useState(null);
  const [cameraOverlayVisible, setCameraOverlayVisible] = useState(true);
  const [transitionKind, setTransitionKind] = useState('fade');
  const [transitionKey, setTransitionKey] = useState(0);
  const containerRef = useRef(null);
  
  // Track slide position for each deck - this is our source of truth
  const [deckPositions, setDeckPositions] = useState({
    'quick-demo': 0,
    'vibe-coding': 0,
    'my-presentation': 0,
    'demo-deck': 0,
    'ai-frameworks': 0,
  });
  
  // Get current index for the active deck
  const currentIndex = deckPositions[currentDeck] || 0;
  
  // Function to update position for current deck
  const setCurrentIndex = (indexOrUpdater) => {
    setDeckPositions(prev => {
      const newIndex = typeof indexOrUpdater === 'function' 
        ? indexOrUpdater(prev[currentDeck] || 0)
        : indexOrUpdater;
      
      return {
        ...prev,
        [currentDeck]: newIndex
      };
    });
  };

  // Joke manager (only if jokes config exists)
  const { currentJoke, dismissJoke, preloadedCount, triggerJokeByHotkey } = useJokeManager(jokesConfig || {});

  // Audience/Stage window manager
  const { 
    isAudienceOpen, 
    toggleAudienceWindow,
    presentationStartTime,
    sendJokeToAudience,
    dismissJokeInAudience 
  } = useAudienceWindow({
    currentIndex,
    totalSlides: slides.length,
    currentSlide: slides[currentIndex],
    slides,
    jokesConfig,
    deckId: currentDeck,
    onNext: () => {
      if (currentIndex < slides.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setTransitionKey(k => k + 1);
      }
    },
    onPrev: () => {
      if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        setTransitionKey(k => k + 1);
      }
    },
    onGoTo: (index) => {
      if (index >= 0 && index < slides.length) {
        setCurrentIndex(index);
        setTransitionKey(k => k + 1);
      }
    },
    onTriggerJoke: triggerJokeByHotkey,
  });

  // Sync jokes to audience window
  useEffect(() => {
    if (currentJoke) {
      sendJokeToAudience(currentJoke);
    } else {
      dismissJokeInAudience();
    }
  }, [currentJoke, sendJokeToAudience, dismissJokeInAudience]);

  // Load the selected deck
  useEffect(() => {
    console.log('Loading deck:', currentDeck);
    console.log('myPresentation:', myPresentation);
    console.log('demoDeck:', demoDeck);
    console.log('quickDemo:', quickDemo);
    
    try {
      let loadedSlides;
      
      switch (currentDeck) {
        case 'my-presentation':
          console.log('Processing my-presentation');
          loadedSlides = processDeck(myPresentation.config, myPresentation.mdxModules);
          setJokesConfig(myPresentation.jokes);
          setCameraOverlay(myPresentation.config.cameraOverlay);
          console.log('Loaded slides:', loadedSlides);
          console.log('Loaded jokes:', myPresentation.jokes);
          break;
        case 'vibe-coding':
          console.log('Processing vibe-coding');
          loadedSlides = processDeck(vibeCoding.config, vibeCoding.mdxModules);
          setJokesConfig(null);
          setCameraOverlay(vibeCoding.config.cameraOverlay);
          break;
        case 'demo-deck':
          console.log('Processing demo-deck');
          loadedSlides = processDeck(demoDeck.config, demoDeck.mdxModules);
          setJokesConfig(demoDeck.jokes);
          setCameraOverlay(demoDeck.config.cameraOverlay);
          console.log('Loaded jokes:', demoDeck.jokes);
          break;
        case 'quick-demo':
          console.log('Processing quick-demo');
          loadedSlides = processDeck(quickDemo.config, quickDemo.mdxModules);
          setJokesConfig(null); // No jokes for quick-demo
          setCameraOverlay(quickDemo.config.cameraOverlay);
          break;
        case 'ai-frameworks':
          console.log('Processing ai-frameworks');
          loadedSlides = processDeck(aiFrameworks.config, aiFrameworks.mdxModules);
          setJokesConfig(null);
          setCameraOverlay(aiFrameworks.config.cameraOverlay);
          break;
        default:
          loadedSlides = processDeck(quickDemo.config, quickDemo.mdxModules);
          setJokesConfig(null);
          setCameraOverlay(null);
      }
      
      console.log('Setting slides:', loadedSlides);
      setSlides(loadedSlides);
    } catch (error) {
      console.error('Failed to load deck:', error);
      console.error('Error stack:', error.stack);
      // Show error state
      setSlides([{
        id: 'error',
        type: 'error',
        error: `Failed to load deck: ${error.message}`
      }]);
    }
  }, [currentDeck]);

  // Use navigation hook with controlled state
  const {
    next,
    prev,
    goTo,
    canGoNext,
    canGoPrev,
  } = useSlideNavigation(currentIndex, setCurrentIndex, slides.length);
  
  const totalSlides = slides.length;

  const handleNext = () => {
    if (canGoNext) {
      next();
      setTransitionKey((k) => k + 1);
    }
  };

  const handlePrev = () => {
    if (canGoPrev) {
      prev();
      setTransitionKey((k) => k + 1);
    }
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current || document.documentElement;
    if (!document.fullscreenElement) {
      await el.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  };

  const toggleTransition = () => {
    const transitions = [
      'fade', 
      'slide', 
      'scale', 
      'slideUp', 
      'zoom', 
      'flip', 
      'blur', 
      'rotate', 
      'bounce', 
      'slideDown'
    ];
    setTransitionKind((k) => {
      const currentIndex = transitions.indexOf(k);
      const nextIndex = (currentIndex + 1) % transitions.length;
      return transitions[nextIndex];
    });
  };

  const toggleCameraOverlay = () => {
    setCameraOverlayVisible(prev => !prev);
  };

  useKeyboardNav({
    onNext: handleNext,
    onPrev: handlePrev,
    onToggleFullscreen: toggleFullscreen,
    onToggleTransition: toggleTransition,
    onToggleCameraOverlay: toggleCameraOverlay,
    onTogglePresenter: toggleAudienceWindow,
  });

  const currentSlide = slides[currentIndex];

  // Show loading state if no slides yet
  if (!slides || slides.length === 0) {
    return (
      <div className="w-screen h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-xl">Loading presentation...</div>
        </div>
      </div>
    );
  }

  const renderSlide = (slide) => {
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
      case 'error':
        return (
          <div className="text-red-500 max-w-2xl mx-auto p-8">
            <h2 className="text-3xl font-bold mb-4">Error Loading Slide</h2>
            <p>{slide.error}</p>
          </div>
        );
      default:
        return <div className="text-red-500">Unknown slide type: {slide.type}</div>;
    }
  };

  const handleClick = (e) => {
    // Click-to-advance unless clicking interactive elements
    const target = e.target;
    const interactive = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'IFRAME'];
    if (!interactive.includes(target.tagName)) {
      handleNext();
    }
  };

  const nextSlide = slides[currentIndex + 1];
  const currentNotes = currentSlide?.notes || currentSlide?.frontmatter?.notes || '';

  return (
    <div ref={containerRef} className="w-screen h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Top bar - Timer, deck selector, slide counter */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <DeckSelector 
            decks={availableDecks}
            currentDeck={currentDeck}
            onSelectDeck={(deckId) => setCurrentDeck(deckId)}
          />
          <div className="flex items-center gap-2">
            <span className="text-green-400">●</span>
            <span className="text-lg font-semibold">
              Slide {currentIndex + 1} of {totalSlides}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTransition}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs transition-colors"
          >
            Transition: <strong>{transitionKind}</strong> ↻
          </button>
          <PresenterTimer startTime={presentationStartTime} />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Current slide + Notes */}
        <div className="flex-1 flex flex-col p-4 gap-4">
          {/* Current slide preview */}
          <div 
            className="flex-1 bg-black rounded-xl overflow-hidden relative cursor-pointer"
            onClick={handleClick}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[142%] h-[142%] flex items-center justify-center" style={{ transform: 'scale(0.7)' }}>
                <div className="w-full h-full">
                  <SlideChrome
                    currentIndex={currentIndex}
                    totalSlides={totalSlides}
                    onPrev={(e) => { e?.stopPropagation(); handlePrev(); }}
                    onNext={(e) => { e?.stopPropagation(); handleNext(); }}
                    onToggleFullscreen={(e) => { e?.stopPropagation(); toggleFullscreen(); }}
                    onToggleCameraOverlay={(e) => { e?.stopPropagation(); toggleCameraOverlay(); }}
                    canGoPrev={canGoPrev}
                    canGoNext={canGoNext}
                    cameraOverlay={cameraOverlay}
                    cameraOverlayVisible={cameraOverlayVisible}
                    hideControls={true}
                  >
                    <AnimatePresence mode="wait">
                      <Transition key={`${currentSlide.id}-${transitionKey}`} kind={transitionKind} active>
                        {renderSlide(currentSlide)}
                      </Transition>
                    </AnimatePresence>
                  </SlideChrome>
                </div>
              </div>
            </div>
            <div className="absolute top-3 left-3 px-2 py-1 bg-purple-600 rounded text-xs font-semibold z-10">
              CURRENT
            </div>
          </div>

          {/* Notes section */}
          <div className="h-40 bg-gray-800 rounded-xl p-4 overflow-y-auto">
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
          <div className="h-48 bg-black rounded-xl overflow-hidden relative">
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
                onClick={handlePrev}
                disabled={!canGoPrev}
                className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={handleNext}
                disabled={!canGoNext}
                className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Stage window toggle */}
          <button
            onClick={toggleAudienceWindow}
            className={`py-3 px-4 rounded-xl font-semibold transition-colors ${
              isAudienceOpen 
                ? 'bg-green-600 hover:bg-green-500' 
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {isAudienceOpen ? '📺 Stage Window Open' : '📺 Open Stage Window (P)'}
          </button>

          {/* Joke triggers */}
          <div className="flex-1 bg-gray-800 rounded-xl p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span>🎭</span> Joke Panel
            </h3>
            {jokesConfig?.jokes?.length > 0 ? (
              <div className="space-y-2">
                {jokesConfig.jokes.map((joke) => (
                  <button
                    key={joke.id}
                    onClick={() => triggerJokeByHotkey(joke.hotkey)}
                    className="w-full py-2 px-3 bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 rounded-lg text-left flex items-center gap-3 transition-all shadow-md hover:shadow-lg"
                  >
                    <span className="w-8 h-8 bg-white/20 rounded flex items-center justify-center font-mono font-bold">
                      {joke.hotkey}
                    </span>
                    <span className="text-sm font-medium truncate">{joke.id}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">No jokes configured</p>
            )}
          </div>
        </div>
      </div>

      {/* Joke overlay */}
      <JokeOverlay joke={currentJoke} onDismiss={dismissJoke} />
    </div>
  );
}

export default App;
