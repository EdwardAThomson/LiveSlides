import { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import SlideChrome from './components/SlideChrome';
import Transition from './components/Transition';
import TextSlide from './components/slides/TextSlide';
import ImageSlide from './components/slides/ImageSlide';
import YouTubeSlide from './components/slides/YouTubeSlide';
import IframeSlide from './components/slides/IframeSlide';
import MDXSlide from './components/slides/MDXSlide';
import JokeOverlay from './components/JokeOverlay';
import useSlideNavigation from './hooks/useSlideNavigation';
import useKeyboardNav from './hooks/useKeyboardNav';
import useJokeManager from './hooks/useJokeManager';
import { processDeck } from './lib/deckLoader';
import myPresentation from './decks/my-presentation';
import demoDeck from './decks/demo-deck';
import quickDemo from './decks/quick-demo';


function App() {
  const [currentDeck, setCurrentDeck] = useState('quick-demo'); // Start with quick-demo
  const [slides, setSlides] = useState([]); // Initialize empty, will load from deck
  const [jokesConfig, setJokesConfig] = useState(null);
  const [transitionKind, setTransitionKind] = useState('fade');
  const [transitionKey, setTransitionKey] = useState(0);
  const containerRef = useRef(null);

  // Joke manager (only if jokes config exists)
  const { currentJoke, dismissJoke, preloadedCount } = useJokeManager(jokesConfig || {});

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
          console.log('Loaded slides:', loadedSlides);
          console.log('Loaded jokes:', myPresentation.jokes);
          break;
        case 'demo-deck':
          console.log('Processing demo-deck');
          loadedSlides = processDeck(demoDeck.config, demoDeck.mdxModules);
          setJokesConfig(demoDeck.jokes);
          console.log('Loaded jokes:', demoDeck.jokes);
          break;
        case 'quick-demo':
          console.log('Processing quick-demo');
          loadedSlides = processDeck(quickDemo.config, quickDemo.mdxModules);
          setJokesConfig(null); // No jokes for quick-demo
          break;
        default:
          loadedSlides = processDeck(quickDemo.config, quickDemo.mdxModules);
          setJokesConfig(null);
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

  const {
    currentIndex,
    totalSlides,
    next,
    prev,
    canGoNext,
    canGoPrev,
  } = useSlideNavigation(slides.length);

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

  useKeyboardNav({
    onNext: handleNext,
    onPrev: handlePrev,
    onToggleFullscreen: toggleFullscreen,
    onToggleTransition: toggleTransition,
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
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
      >
        {/* AnimatePresence enables exit animations */}
        <AnimatePresence mode="wait">
          <Transition key={`${currentSlide.id}-${transitionKey}`} kind={transitionKind} active>
            {renderSlide(currentSlide)}
          </Transition>
        </AnimatePresence>
      </SlideChrome>

      {/* Top controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 text-xs text-white/70 z-50">
        <div className="flex gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
            Transition: <strong>{transitionKind}</strong> (press S)
          </span>
        </div>
        
        {/* Deck switcher */}
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentDeck('quick-demo');
            }}
            className={`px-3 py-1.5 rounded-lg backdrop-blur-sm transition-colors ${
              currentDeck === 'quick-demo' 
                ? 'bg-green-500/40 border border-green-400' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            ⚡ Quick Demo
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentDeck('my-presentation');
            }}
            className={`px-3 py-1.5 rounded-lg backdrop-blur-sm transition-colors ${
              currentDeck === 'my-presentation' 
                ? 'bg-blue-500/40 border border-blue-400' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            📝 My Presentation
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentDeck('demo-deck');
            }}
            className={`px-3 py-1.5 rounded-lg backdrop-blur-sm transition-colors ${
              currentDeck === 'demo-deck' 
                ? 'bg-blue-500/40 border border-blue-400' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            🎨 MDX Examples
          </button>
        </div>

        {/* Joke indicator */}
        {jokesConfig && preloadedCount > 0 && (
          <div className="mt-2 px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-400/30 text-xs">
            🎭 Jokes: Press <strong>1</strong>, <strong>2</strong>, <strong>3</strong>, or <strong>Q</strong>
          </div>
        )}
      </div>

      {/* Joke overlay */}
      <JokeOverlay joke={currentJoke} onDismiss={dismissJoke} />
    </div>
  );
}

export default App;
