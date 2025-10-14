import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getAnimationVariants,
  getTransitionConfig,
  getPositionStyles,
  getSizeStyles,
  mergeAnimationConfig,
  validateAnimationConfig,
  validatePosition,
  validateSize
} from '../lib/jokeAnimations';

export default function JokeOverlay({ joke, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (joke) {
      // Validate configuration
      if (joke.animation) {
        validateAnimationConfig(joke.animation);
      }
      if (joke.position) {
        validatePosition(joke.position);
      }
      if (joke.size) {
        validateSize(joke.size);
      }

      // Show the joke
      setIsVisible(true);

      // Auto-dismiss after display duration
      const displayDuration = joke.displayDuration || joke.duration || 2000;
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Wait for exit animation before calling onDismiss
        const exitDuration = joke.animation?.duration || 500;
        setTimeout(onDismiss, exitDuration);
      }, displayDuration);

      return () => clearTimeout(timer);
    }
  }, [joke, onDismiss]);

  if (!joke) return null;

  // Merge animation config with defaults
  const animationConfig = mergeAnimationConfig(joke.animation);
  
  // Get animation variants
  const variants = getAnimationVariants(
    animationConfig.entry,
    animationConfig.exit,
    animationConfig.easing
  );

  // Get transition config
  const transition = getTransitionConfig(
    animationConfig.duration,
    animationConfig.delay,
    animationConfig.easing
  );

  // Get position styles
  const positionStyles = getPositionStyles(
    joke.position || 'center',
    joke.customPosition
  );

  // Get size styles
  const sizeStyles = getSizeStyles(
    joke.size || 'large',
    joke.maxWidth,
    joke.maxHeight
  );

  // Handle manual dismiss
  const handleDismiss = () => {
    setIsVisible(false);
    const exitDuration = animationConfig.duration;
    setTimeout(onDismiss, exitDuration);
  };

  // Determine backdrop configuration
  const backdropBlur = joke.effects?.blur ? 'backdrop-blur-lg' : ''; // No blur by default
  const backdropOpacity = joke.effects?.backdrop ?? 0.3; // Default to 30% opacity (was 80%)
  const backdropColor = joke.effects?.backdropColor || 'black';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed inset-0 z-[9999] ${backdropBlur}`}
          style={{ backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleDismiss}
        >
          <motion.div
            className="absolute"
            style={{
              ...positionStyles,
              ...sizeStyles
            }}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            {renderJokeContent(joke)}
          </motion.div>

          {/* Dismiss hint */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Click anywhere or wait to dismiss
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Render joke content based on type
 */
function renderJokeContent(joke) {
  // Get shadow class
  const shadowClass = joke.effects?.shadow 
    ? `shadow-${joke.effects.shadow}` 
    : 'shadow-2xl';

  // Apply rotation if specified
  const rotationStyle = joke.rotation 
    ? { transform: `rotate(${joke.rotation}deg)` } 
    : {};

  switch (joke.type) {
    case 'image':
    case 'gif':
      return (
        <img
          src={joke.src}
          alt={joke.alt || 'Joke'}
          className={`w-full h-full object-contain rounded-lg ${shadowClass}`}
          style={rotationStyle}
        />
      );

    case 'video':
      return (
        <video
          src={joke.src}
          autoPlay
          loop={joke.loop !== false}
          muted={joke.muted !== false}
          className={`w-full h-full rounded-lg ${shadowClass}`}
          style={rotationStyle}
        />
      );

    case 'text':
      return (
        <div 
          className={`bg-white text-black p-12 rounded-lg ${shadowClass} max-w-3xl`}
          style={rotationStyle}
        >
          <p className="text-6xl font-bold text-center">{joke.text}</p>
        </div>
      );

    default:
      return null;
  }
}
