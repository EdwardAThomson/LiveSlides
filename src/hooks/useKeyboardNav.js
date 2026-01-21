import { useEffect } from 'react';

export default function useKeyboardNav({ 
  onNext, 
  onPrev, 
  onToggleFullscreen,
  onToggleTransition,
  onToggleCameraOverlay,
  onTogglePresenter,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent default for navigation keys
      if (['ArrowLeft', 'ArrowRight', ' ', 'f', 'F', 's', 'S', 'c', 'C', 'p', 'P'].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          onNext?.();
          break;
        case 'ArrowLeft':
          onPrev?.();
          break;
        case 'f':
        case 'F':
          onToggleFullscreen?.();
          break;
        case 's':
        case 'S':
          onToggleTransition?.();
          break;
        case 'c':
        case 'C':
          onToggleCameraOverlay?.();
          break;
        case 'p':
        case 'P':
          onTogglePresenter?.();
          break;
        case 'Escape':
          // Let browser handle escape (exits fullscreen)
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, onToggleFullscreen, onToggleTransition, onToggleCameraOverlay, onTogglePresenter]);
}
