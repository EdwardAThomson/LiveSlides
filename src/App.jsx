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
import usePresenterWindow from './hooks/usePresenterWindow';
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

  // Presenter window manager
  const { 
    isPresenterOpen, 
    togglePresenterWindow 
  } = usePresenterWindow({
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
    onTogglePresenter: togglePresenterWindow,
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

  return (
    <div 
      ref={containerRef} 
      className="w-screen h-screen" 
      onClick={handleClick}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        containerRef.current.touchStartX = touch.clientX;
      }}
      onTouchEnd={(e) => {
        const touch = e.changedTouches[0];
        const startX = containerRef.current.touchStartX;
        const endX = touch.clientX;
        const diff = startX - endX;
        
        // Swipe left (next) or right (prev)
        if (Math.abs(diff) > 50) {
          if (diff > 0 && canGoNext) {
            handleNext();
          } else if (diff < 0 && canGoPrev) {
            handlePrev();
          }
        }
      }}
    >
      <SlideChrome
        currentIndex={currentIndex}
        totalSlides={totalSlides}
        onPrev={(e) => {
          e?.stopPropagation();
          handlePrev();
        }}
        onNext={(e) => {
          e?.stopPropagation();
          handleNext();
        }}
        onToggleFullscreen={(e) => {
          e?.stopPropagation();
          toggleFullscreen();
        }}
        onToggleCameraOverlay={(e) => {
          e?.stopPropagation();
          toggleCameraOverlay();
        }}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        cameraOverlay={cameraOverlay}
        cameraOverlayVisible={cameraOverlayVisible}
      >
        {/* AnimatePresence enables exit animations */}
        <AnimatePresence mode="wait">
          <Transition key={`${currentSlide.id}-${transitionKey}`} kind={transitionKind} active>
            {renderSlide(currentSlide)}
          </Transition>
        </AnimatePresence>
      </SlideChrome>

      {/* Top controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-3 z-50">
        {/* Deck Selector */}
        <DeckSelector 
          decks={availableDecks}
          currentDeck={currentDeck}
          onSelectDeck={(deckId) => {
            setCurrentDeck(deckId);
          }}
        />
        
        {/* Transition indicator */}
        <span className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-xs text-white/70">
          Transition: <strong className="text-white">{transitionKind}</strong> (press S)
        </span>

        {/* Joke indicator */}
        {jokesConfig && preloadedCount > 0 && (
          <div className="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-400/30 text-xs text-white/70">
            🎭 Jokes: Press <strong className="text-white">1</strong>, <strong className="text-white">2</strong>, <strong className="text-white">3</strong>, or <strong className="text-white">Q</strong>
          </div>
        )}

        {/* Presenter View indicator */}
        <button
          onClick={togglePresenterWindow}
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
            isPresenterOpen 
              ? 'bg-green-500/20 border border-green-400/30 text-green-400' 
              : 'bg-white/10 backdrop-blur-sm text-white/70 hover:bg-white/20'
          }`}
        >
          {isPresenterOpen ? '📺 Presenter Open' : '📺 Presenter View (P)'}
        </button>
      </div>

      {/* Joke overlay */}
      <JokeOverlay joke={currentJoke} onDismiss={dismissJoke} />
    </div>
  );
}

export default App;
