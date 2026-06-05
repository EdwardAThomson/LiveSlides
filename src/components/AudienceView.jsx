import React from 'react';
import JokeOverlay from './JokeOverlay';
import SlideChrome from './SlideChrome';
import SlideStage from './SlideStage';
import Slide from './slides/Slide';
import { processDeck } from '../lib/deckLoader';
import { loadDeck } from '../decks/registry';

// Check if running in Tauri
const isTauri = () => typeof window !== 'undefined' && window.__TAURI_INTERNALS__;

// Audience/Stage View - Clean slide display for projector/external display
export default function AudienceView() {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [status, setStatus] = React.useState('Waiting for presenter...');
    const [slides, setSlides] = React.useState([]);
    const [loadError, setLoadError] = React.useState(null);
    const [currentDeckId, setCurrentDeckId] = React.useState(null);
    const [currentJoke, setCurrentJoke] = React.useState(null);
    const [cameraOverlayVisible, setCameraOverlayVisible] = React.useState(true);
    const [cameraOverlay, setCameraOverlay] = React.useState(null);
    const [totalSlides, setTotalSlides] = React.useState(0);
    const [theme, setTheme] = React.useState('dark');
    const currentDeckIdRef = React.useRef(null);

    // Track if current deck is external (loaded via externalSlides)
    const [isExternalDeck, setIsExternalDeck] = React.useState(false);

    // Load deck when deckId changes (bundled decks only)
    React.useEffect(() => {
        if (!currentDeckId) return;
        // Skip loading if this is an external deck - slides come via message
        if (isExternalDeck) {
            console.log('[Audience] Skipping deck load - external deck');
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                setStatus('Loading deck...');
                const deck = await loadDeck(currentDeckId);
                if (cancelled) return;
                const loadedSlides = processDeck(deck.config, deck.mdxModules);
                setSlides(loadedSlides);
                setTotalSlides(loadedSlides.length);
                setCameraOverlay(deck.config.cameraOverlay || null);
                setStatus('');
                setLoadError(null);
            } catch (err) {
                if (cancelled) return;
                console.error('[Audience] Deck load error:', err);
                setLoadError(`Deck error: ${err.message}`);
                setStatus('Failed to load deck');
            }
        })();

        return () => { cancelled = true; };
    }, [currentDeckId, isExternalDeck]);

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
                    if (data.cameraOverlayVisible !== undefined) {
                        setCameraOverlayVisible(data.cameraOverlayVisible);
                    }
                    if (data.cameraOverlay !== undefined) {
                        setCameraOverlay(data.cameraOverlay);
                    }
                    if (data.theme) {
                        setTheme(data.theme);
                    }

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
                if (event.data.cameraOverlayVisible !== undefined) {
                    setCameraOverlayVisible(event.data.cameraOverlayVisible);
                }
                if (event.data.cameraOverlay !== undefined) {
                    setCameraOverlay(event.data.cameraOverlay);
                }
                if (event.data.theme) {
                    setTheme(event.data.theme);
                }

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

    const currentSlide = slides[currentIndex];

    // Loading/error state
    if (slides.length === 0) {
        return (
            <div className={`w-screen h-screen flex items-center justify-center transition-colors duration-300 ${theme === 'light' ? 'light-theme' : ''}`}
                style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}>
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
        <div className={`w-full h-full transition-colors duration-300 ${theme === 'light' ? 'light-theme' : ''}`}>
            <SlideStage className="w-full h-full">
                <SlideChrome
                    currentIndex={currentIndex}
                    totalSlides={totalSlides || slides.length}
                    onPrev={() => { }} // Navigation controlled by presenter
                    onNext={() => { }}
                    onToggleFullscreen={toggleFullscreen}
                    onToggleCameraOverlay={() => { }} // Controlled by presenter
                    canGoPrev={currentIndex > 0}
                    canGoNext={currentIndex < slides.length - 1}
                    cameraOverlay={cameraOverlay}
                    cameraOverlayVisible={cameraOverlayVisible}
                    hideControls={true}
                >
                    <Slide slide={currentSlide} />
                    <JokeOverlay joke={currentJoke} onDismiss={() => setCurrentJoke(null)} />
                </SlideChrome>
            </SlideStage>
        </div>
    );
}
