import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import SlideChrome from './components/SlideChrome';
import SlideStage from './components/SlideStage';
import Transition from './components/Transition';
import Slide from './components/slides/Slide';
import JokeOverlay from './components/JokeOverlay';
import DeckSelector from './components/DeckSelector';
import CameraSettings from './components/CameraSettings';
import useSlideNavigation from './hooks/useSlideNavigation';
import useKeyboardNav from './hooks/useKeyboardNav';
import useJokeManager from './hooks/useJokeManager';
import useAudienceWindow from './hooks/useAudienceWindow';
import PresenterTimer from './components/PresenterTimer';
import { processDeck } from './lib/deckLoader';
import { loadRegistry, addDeckToRegistry, openDeckFolderDialog, updateDeckLastOpened, saveOverlayToDeckFile } from './lib/externalDeckRegistry';
import { loadExternalDeck } from './lib/externalDeckLoader';
import { availableDecks, loadDeck, isBundledDeck } from './decks/registry';
import { resolveOverlay, saveOverlayOverride, clearOverlayOverride, DEFAULT_OVERLAY } from './lib/overlaySettings';

// Check if running in Tauri
const isTauri = () => typeof window !== 'undefined' && window.__TAURI_INTERNALS__;

function App() {
  const [currentDeck, setCurrentDeck] = useState('quick-demo'); // Start with quick-demo
  const [slides, setSlides] = useState([]); // Initialize empty, will load from deck
  const [jokesConfig, setJokesConfig] = useState(null);
  const [cameraOverlay, setCameraOverlay] = useState(null); // effective (deck default + override)
  const [deckDefaultOverlay, setDeckDefaultOverlay] = useState(null); // raw deck.json value, for reset
  const [cameraOverlayVisible, setCameraOverlayVisible] = useState(true);
  const [showCameraSettings, setShowCameraSettings] = useState(false);
  const [transitionKind, setTransitionKind] = useState('fade');
  const [transitionKey, setTransitionKey] = useState(0);
  const [theme, setTheme] = useState('dark');
  const containerRef = useRef(null);

  // External decks from registry (Tauri only)
  const [externalDecks, setExternalDecks] = useState([]);
  const [loadingExternalDeck, setLoadingExternalDeck] = useState(false);
  const [currentExternalDeck, setCurrentExternalDeck] = useState(null); // Currently loaded external deck data

  // Track slide position for each deck - this is our source of truth.
  // Populated lazily; any deck not yet present defaults to index 0.
  const [deckPositions, setDeckPositions] = useState({});

  // Load external deck registry on mount (Tauri only)
  useEffect(() => {
    if (!isTauri()) return;

    async function loadExternalDecks() {
      try {
        const registry = await loadRegistry();
        setExternalDecks(registry.decks || []);
        console.log('[App] Loaded external decks:', registry.decks?.length || 0);
      } catch (error) {
        console.error('[App] Failed to load deck registry:', error);
      }
    }

    loadExternalDecks();
  }, []);

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

  const totalSlides = slides.length;

  // Navigation logic (single source of truth, shared with keyboard, clicks,
  // on-screen controls and the audience window).
  const { next, prev, goTo, canGoNext, canGoPrev } = useSlideNavigation(
    currentIndex,
    setCurrentIndex,
    totalSlides
  );

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

  const handleGoTo = (index) => {
    goTo(index);
    setTransitionKey((k) => k + 1);
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
    cameraOverlay,
    cameraOverlayVisible,
    theme,
    onNext: handleNext,
    onPrev: handlePrev,
    onGoTo: handleGoTo,
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

  // Handle adding a new external deck
  const handleAddDeck = useCallback(async () => {
    if (!isTauri()) return;

    try {
      const folderPath = await openDeckFolderDialog();
      if (!folderPath) return; // User cancelled

      const result = await addDeckToRegistry(folderPath);
      if (result.success) {
        // Reload the registry
        const registry = await loadRegistry();
        setExternalDecks(registry.decks || []);
        console.log('[App] Added deck:', result.deck.name);
      } else {
        alert(`Failed to add deck: ${result.error}`);
      }
    } catch (error) {
      console.error('[App] Error adding deck:', error);
      alert(`Error adding deck: ${error.message}`);
    }
  }, []);

  // Handle selecting an external deck
  const handleSelectExternalDeck = useCallback(async (deck) => {
    if (!isTauri()) return;

    setLoadingExternalDeck(true);
    try {
      console.log('[App] Loading external deck:', deck.name);
      const deckData = await loadExternalDeck(deck.path);

      setCurrentExternalDeck(deckData);
      setSlides(deckData.slides);
      setJokesConfig(deckData.jokes);
      const baseOverlay = deckData.config.cameraOverlay || null;
      setDeckDefaultOverlay(baseOverlay);
      setCameraOverlay(resolveOverlay(baseOverlay, deck.id));
      setCurrentDeck(deck.id);

      // Initialize position for this deck if not exists
      setDeckPositions(prev => ({
        ...prev,
        [deck.id]: prev[deck.id] || 0,
      }));

      // Update last opened timestamp
      await updateDeckLastOpened(deck.id);

      console.log('[App] Loaded external deck with', deckData.slides.length, 'slides');
    } catch (error) {
      console.error('[App] Error loading external deck:', error);
      alert(`Error loading deck: ${error.message}`);
    } finally {
      setLoadingExternalDeck(false);
    }
  }, []);

  // Load the selected deck (bundled decks only - external decks are loaded by
  // handleSelectExternalDeck and pushed straight into state).
  useEffect(() => {
    if (!isBundledDeck(currentDeck)) return;

    let cancelled = false;

    (async () => {
      try {
        const deck = await loadDeck(currentDeck);
        if (cancelled) return;

        setSlides(processDeck(deck.config, deck.mdxModules));
        setJokesConfig(deck.jokes ?? null);
        const baseOverlay = deck.config.cameraOverlay ?? null;
        setDeckDefaultOverlay(baseOverlay);
        setCameraOverlay(resolveOverlay(baseOverlay, currentDeck));
        if (deck.config?.theme) {
          setTheme(deck.config.theme);
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load deck:', error);
        setSlides([{
          id: 'error',
          type: 'error',
          error: `Failed to load deck: ${error.message}`,
        }]);
      }
    })();

    return () => { cancelled = true; };
  }, [currentDeck]);
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current || document.documentElement;
    if (!document.fullscreenElement) {
      await el.requestFullscreen().catch(() => { });
    } else {
      await document.exitFullscreen().catch(() => { });
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

  // Live-edit the overlay (applies to preview + Stage) and persist per-deck.
  const updateCameraOverlay = (next) => {
    setCameraOverlay(next);
    saveOverlayOverride(currentDeck, next);
  };

  // Drop the override, reverting to the deck.json default.
  const resetCameraOverlay = () => {
    clearOverlayOverride(currentDeck);
    setCameraOverlay(deckDefaultOverlay);
  };

  // Tauri + external deck only: bake current settings into the deck's deck.json.
  const isExternalDeck = !isBundledDeck(currentDeck);
  const canSaveOverlayToDeck = isTauri() && isExternalDeck && !!currentExternalDeck?.deckPath;
  const saveOverlayToDeck = async () => {
    if (!canSaveOverlayToDeck) return;
    const result = await saveOverlayToDeckFile(currentExternalDeck.deckPath, cameraOverlay ?? DEFAULT_OVERLAY);
    if (result.success) {
      clearOverlayOverride(currentDeck); // deck file is now the source of truth
      setDeckDefaultOverlay(cameraOverlay ?? DEFAULT_OVERLAY);
    } else {
      alert(`Could not save to deck file: ${result.error}`);
    }
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
    <div
      ref={containerRef}
      className={`w-screen h-screen flex flex-col overflow-hidden transition-colors duration-300 ${theme === 'light' ? 'light-theme' : ''}`}
      style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}
    >
      {/* Top bar - Timer, deck selector, slide counter */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b transition-colors duration-300"
        style={{ backgroundColor: 'var(--bg-chrome)', borderColor: 'var(--border-main)' }}
      >
        <div className="flex items-center gap-4">
          <DeckSelector
            decks={availableDecks}
            currentDeck={currentDeck}
            onSelectDeck={(deckId) => setCurrentDeck(deckId)}
            externalDecks={externalDecks}
            onAddDeck={isTauri() ? handleAddDeck : undefined}
            onSelectExternalDeck={handleSelectExternalDeck}
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
            onClick={toggleTheme}
            className="p-2 rounded hover:bg-white/10 transition-colors text-xl"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={toggleTransition}
            className="px-3 py-1 rounded hover:bg-white/10 text-xs transition-colors border"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-main)' }}
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
          {/* Current slide preview — fixed 1280×720 canvas scaled to fit,
              a faithful WYSIWYG of the Stage window. */}
          <div
            className="flex-1 rounded-xl overflow-hidden relative cursor-pointer shadow-2xl transition-colors duration-300"
            style={{ backgroundColor: 'var(--bg-app)' }}
            onClick={handleClick}
          >
            <SlideStage className="w-full h-full">
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
                showBoundary={true}
              >
                <AnimatePresence mode="wait">
                  <Transition key={`${currentSlide.id}-${transitionKey}`} kind={transitionKind} active>
                    <Slide slide={currentSlide} />
                  </Transition>
                </AnimatePresence>
              </SlideChrome>
            </SlideStage>
            <div className="absolute top-3 left-3 px-2 py-1 bg-purple-600 rounded text-xs font-semibold z-10">
              CURRENT
            </div>
          </div>

          {/* Notes section */}
          <div
            className="h-40 rounded-xl p-4 overflow-y-auto transition-colors duration-300 border"
            style={{ backgroundColor: 'var(--bg-chrome)', borderColor: 'var(--border-main)' }}
          >
            <h3
              className="text-sm font-bold uppercase tracking-wide mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Speaker Notes
            </h3>
            {currentNotes ? (
              <p className="text-lg leading-relaxed whitespace-pre-wrap">{currentNotes}</p>
            ) : (
              <p style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>No notes for this slide</p>
            )}
          </div>
        </div>

        {/* Right panel - Next slide + Controls */}
        <div
          className="w-80 flex flex-col p-4 gap-4 border-l transition-colors duration-300"
          style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-main)' }}
        >
          {/* Next slide preview */}
          <div
            className="h-48 rounded-xl overflow-hidden relative transition-colors duration-300 shadow-md"
            style={{ backgroundColor: 'var(--bg-slide)' }}
          >
            {nextSlide ? (
              <>
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                  <div className="w-[250%] h-[250%] flex items-center justify-center" style={{ transform: 'scale(0.4)' }}>
                    <Slide slide={nextSlide} />
                  </div>
                </div>
                <div
                  className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-semibold"
                  style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-main)' }}
                >
                  NEXT
                </div>
              </>
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ color: 'var(--text-dim)' }}
              >
                End of presentation
              </div>
            )}
          </div>

          {/* Navigation controls */}
          <div
            className="rounded-xl p-4 border transition-colors duration-300"
            style={{ backgroundColor: 'var(--bg-chrome)', borderColor: 'var(--border-main)' }}
          >
            <h3
              className="text-sm font-bold uppercase tracking-wide mb-3"
              style={{ color: 'var(--text-muted)' }}
            >
              Navigation
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handlePrev}
                disabled={!canGoPrev}
                className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all disabled:opacity-30"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-main)' }}
              >
                ← Prev
              </button>
              <button
                onClick={handleNext}
                disabled={!canGoNext}
                className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all shadow-lg active:scale-95"
                style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
              >
                Next →
              </button>
            </div>
          </div>

          {/* Stage window toggle */}
          <div className="flex flex-col gap-2">
            <button
              onClick={toggleAudienceWindow}
              className={`py-3 px-4 rounded-xl font-semibold transition-colors ${isAudienceOpen
                ? 'bg-green-600 hover:bg-green-500'
                : 'bg-blue-600 hover:bg-blue-500'
                }`}
            >
              {isAudienceOpen ? '📺 Stage Window Open' : '📺 Open Stage Window (P)'}
            </button>

            <div className="flex gap-2">
              <button
                onClick={toggleCameraOverlay}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors border ${cameraOverlayVisible
                  ? 'bg-purple-600 hover:bg-purple-500 text-white'
                  : 'bg-transparent hover:bg-white/5'
                  }`}
                style={{ borderColor: 'var(--border-main)' }}
              >
                {cameraOverlayVisible ? '📹 Hide Camera (C)' : '📹 Show Camera (C)'}
              </button>
              <button
                onClick={() => setShowCameraSettings(v => !v)}
                title="Camera overlay settings"
                className="py-3 px-4 rounded-xl font-semibold transition-colors border hover:bg-white/5"
                style={{ borderColor: 'var(--border-main)' }}
              >
                ⚙️
              </button>
            </div>
          </div>

          {/* Joke triggers */}
          <div
            className="flex-1 rounded-xl p-4 overflow-y-auto border transition-colors duration-300"
            style={{ backgroundColor: 'var(--bg-chrome)', borderColor: 'var(--border-main)' }}
          >
            <h3
              className="text-sm font-bold uppercase tracking-wide mb-3 flex items-center gap-2"
              style={{ color: 'var(--text-muted)' }}
            >
              <span>🎭</span> Joke Panel
            </h3>
            {jokesConfig?.jokes?.length > 0 ? (
              <div className="space-y-2">
                {jokesConfig.jokes.map((joke) => (
                  <button
                    key={joke.id}
                    onClick={() => triggerJokeByHotkey(joke.hotkey)}
                    className="w-full py-2 px-3 rounded-lg text-left flex items-center gap-3 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                    style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
                  >
                    <span className="w-8 h-8 bg-white/20 rounded flex items-center justify-center font-mono font-bold">
                      {joke.hotkey}
                    </span>
                    <span className="text-sm font-medium truncate">{joke.id}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p
                className="text-sm italic"
                style={{ color: 'var(--text-dim)' }}
              >
                No jokes configured
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Joke overlay */}
      <JokeOverlay joke={currentJoke} onDismiss={dismissJoke} />

      {/* Camera overlay settings drawer */}
      <CameraSettings
        open={showCameraSettings}
        onClose={() => setShowCameraSettings(false)}
        config={cameraOverlay ?? DEFAULT_OVERLAY}
        onChange={updateCameraOverlay}
        onReset={resetCameraOverlay}
        onSaveToDeck={saveOverlayToDeck}
        canSaveToDeck={canSaveOverlayToDeck}
      />
    </div>
  );
}

export default App;
