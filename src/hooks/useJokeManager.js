import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to manage joke overlays with hotkey triggers
 * @param {object} jokesConfig - Configuration object with hotkey mappings
 * @returns {object} - Current joke and dismiss function
 */
export default function useJokeManager(jokesConfig = {}) {
  const [currentJoke, setCurrentJoke] = useState(null);
  const preloadedAssets = useRef(new Map());

  // Preload all joke assets
  useEffect(() => {
    if (!jokesConfig.jokes) return;

    jokesConfig.jokes.forEach((joke) => {
      if (joke.type === 'image' || joke.type === 'gif') {
        const img = new Image();
        img.src = joke.src;
        preloadedAssets.current.set(joke.id, img);
      } else if (joke.type === 'video') {
        const video = document.createElement('video');
        video.src = joke.src;
        video.preload = 'auto';
        preloadedAssets.current.set(joke.id, video);
      }
    });

    console.log(`Preloaded ${preloadedAssets.current.size} joke assets`);
  }, [jokesConfig]);

  // Handle hotkey presses
  const handleKeyPress = useCallback(
    (event) => {
      // Don't trigger if typing in an input
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      if (!jokesConfig.jokes) return;

      // Find joke matching the pressed key
      const joke = jokesConfig.jokes.find((j) => j.hotkey === event.key);

      if (joke) {
        console.log(`Triggering joke: ${joke.id} (hotkey: ${joke.hotkey})`);
        setCurrentJoke(joke);
        event.preventDefault();
      }
    },
    [jokesConfig]
  );

  // Register hotkey listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const dismissJoke = useCallback(() => {
    setCurrentJoke(null);
  }, []);

  // Programmatically trigger a joke by hotkey (for presenter view)
  const triggerJokeByHotkey = useCallback((hotkey) => {
    if (!jokesConfig.jokes) return;
    
    const joke = jokesConfig.jokes.find((j) => j.hotkey === hotkey);
    if (joke) {
      console.log(`Triggering joke from presenter: ${joke.id} (hotkey: ${hotkey})`);
      setCurrentJoke(joke);
    }
  }, [jokesConfig]);

  return {
    currentJoke,
    dismissJoke,
    triggerJokeByHotkey,
    preloadedCount: preloadedAssets.current.size,
  };
}
