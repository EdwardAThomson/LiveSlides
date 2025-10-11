import { useState, useRef, useEffect } from 'react';
import SlideChrome from './components/SlideChrome';
import Transition from './components/Transition';
import TextSlide from './components/slides/TextSlide';
import ImageSlide from './components/slides/ImageSlide';
import YouTubeSlide from './components/slides/YouTubeSlide';
import IframeSlide from './components/slides/IframeSlide';
import MDXSlide from './components/slides/MDXSlide';
import useSlideNavigation from './hooks/useSlideNavigation';
import useKeyboardNav from './hooks/useKeyboardNav';
import { processDeck } from './lib/deckLoader';
import myPresentation from '@decks/my-presentation';
import demoDeck from '@decks/demo-deck';

// Demo deck data
const demoSlides = [
  {
    id: 'intro',
    type: 'text',
    html: {
      title: 'Welcome to <em>LiveSlides</em>',
      body: '<p>Dynamic presentations with React, animations, and embedded apps.</p><p class="mt-4">Use <kbd class="px-2 py-1 bg-white/20 rounded">←</kbd> <kbd class="px-2 py-1 bg-white/20 rounded">→</kbd> or <kbd class="px-2 py-1 bg-white/20 rounded">Space</kbd> to navigate. Press <kbd class="px-2 py-1 bg-white/20 rounded">F</kbd> for fullscreen.</p>',
    },
  },
  {
    id: 'features',
    type: 'text',
    html: {
      title: '✨ Features',
      body: '<ul class="text-left max-w-2xl mx-auto space-y-3"><li>🎬 Smooth transitions (fade & slide)</li><li>🖼️ Images, YouTube, and iframes</li><li>⌨️ Keyboard navigation</li><li>🎯 Click-to-advance</li><li>📱 Responsive design</li></ul>',
    },
  },
  {
    id: 'image-demo',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1600&q=80',
    alt: 'Team collaboration',
  },
  {
    id: 'youtube-demo',
    type: 'youtube',
    youtubeId: 'dQw4w9WgXcQ',
    start: 0,
  },
  {
    id: 'iframe-demo',
    type: 'iframe',
    src: 'https://example.com',
  },
  {
    id: 'outro',
    type: 'text',
    html: {
      title: 'Ready to build amazing presentations? 🚀',
      body: '<p>Press <kbd class="px-2 py-1 bg-white/20 rounded">S</kbd> to toggle transitions</p>',
    },
  },
];

function App() {
  const [currentDeck, setCurrentDeck] = useState('hardcoded'); // Start with hardcoded to ensure something renders
  const [slides, setSlides] = useState(demoSlides); // Initialize with hardcoded slides
  const [transitionKind, setTransitionKind] = useState('fade');
  const [transitionKey, setTransitionKey] = useState(0);
  const containerRef = useRef(null);

  // Load the selected deck
  useEffect(() => {
    console.log('Loading deck:', currentDeck);
    console.log('myPresentation:', myPresentation);
    console.log('demoDeck:', demoDeck);
    
    try {
      let loadedSlides;
      
      switch (currentDeck) {
        case 'my-presentation':
          console.log('Processing my-presentation');
          loadedSlides = processDeck(myPresentation.config, myPresentation.mdxModules);
          console.log('Loaded slides:', loadedSlides);
          break;
        case 'demo-deck':
          console.log('Processing demo-deck');
          loadedSlides = processDeck(demoDeck.config, demoDeck.mdxModules);
          break;
        case 'hardcoded':
          console.log('Using hardcoded slides');
          loadedSlides = demoSlides;
          break;
        default:
          loadedSlides = processDeck(myPresentation.config, myPresentation.mdxModules);
      }
      
      console.log('Setting slides:', loadedSlides);
      setSlides(loadedSlides);
    } catch (error) {
      console.error('Failed to load deck:', error);
      console.error('Error stack:', error.stack);
      // Fall back to hardcoded slides
      setSlides(demoSlides);
      setCurrentDeck('hardcoded');
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
    setTransitionKind((k) => (k === 'fade' ? 'slide' : 'fade'));
  };

  useKeyboardNav({
    onNext: handleNext,
    onPrev: handlePrev,
    onToggleFullscreen: toggleFullscreen,
    onToggleTransition: toggleTransition,
  });

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
    <div ref={containerRef} className="w-screen h-screen" onClick={handleClick}>
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
        {/* Keyed transition wrapper to retrigger animation */}
        <Transition key={`${currentSlide.id}-${transitionKey}`} kind={transitionKind} active>
          {renderSlide(currentSlide)}
        </Transition>
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
              setCurrentDeck('hardcoded');
            }}
            className={`px-3 py-1.5 rounded-lg backdrop-blur-sm transition-colors ${
              currentDeck === 'hardcoded' 
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
      </div>
    </div>
  );
}

export default App;
