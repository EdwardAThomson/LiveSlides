import { useEffect, useState } from 'react';

export default function JokeOverlay({ joke, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (joke) {
      // Fade in
      setIsVisible(true);

      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Wait for fade out animation
      }, joke.duration || 2000);

      return () => clearTimeout(timer);
    }
  }, [joke, onDismiss]);

  if (!joke) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }}
    >
      <div
        className={`max-w-4xl max-h-[90vh] transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {joke.type === 'image' && (
          <img
            src={joke.src}
            alt={joke.alt || 'Joke'}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        )}
        
        {joke.type === 'video' && (
          <video
            src={joke.src}
            autoPlay
            loop={joke.loop !== false}
            muted={joke.muted !== false}
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
          />
        )}
        
        {joke.type === 'gif' && (
          <img
            src={joke.src}
            alt={joke.alt || 'Joke'}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        )}

        {joke.type === 'text' && (
          <div className="bg-white text-black p-12 rounded-lg shadow-2xl max-w-3xl">
            <p className="text-6xl font-bold text-center">{joke.text}</p>
          </div>
        )}
      </div>

      {/* Dismiss hint */}
      <div className="absolute bottom-8 text-white/70 text-sm">
        Click anywhere or wait to dismiss
      </div>
    </div>
  );
}
