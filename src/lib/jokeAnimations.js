/**
 * Joke Animation System
 * 
 * Provides Framer Motion animation variants, positioning, and sizing utilities
 * for the enhanced joke overlay system.
 */

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

/**
 * Get entry animation initial state
 */
function getEntryInitial(animationType) {
  const animations = {
    fade: { opacity: 0 },
    scale: { opacity: 0, scale: 0.8 },
    slideInLeft: { opacity: 0, x: '-100vw' },
    slideInRight: { opacity: 0, x: '100vw' },
    slideInTop: { opacity: 0, y: '-100vh' },
    slideInBottom: { opacity: 0, y: '100vh' },
    bounce: { opacity: 0, scale: 0.3, y: -100 },
    flip: { opacity: 0, rotateY: -90 },
    spin: { opacity: 0, rotate: -180, scale: 0.5 },
    zoom: { opacity: 0, scale: 0.1 },
    elastic: { opacity: 0, scale: 0.5 },
    shake: { opacity: 0, x: -50 },
    // Combination animations
    bounceRotate: { opacity: 0, scale: 0.3, y: -100, rotate: -180 },
    slideScale: { opacity: 0, x: '-100vw', scale: 0.5 },
    flipSlide: { opacity: 0, rotateY: -90, x: '50vw' },
    spinZoom: { opacity: 0, rotate: -360, scale: 0.1 },
    shakeScale: { opacity: 0, x: -50, scale: 0.5 },
    slideRotate: { opacity: 0, x: '-100vw', rotate: -90 }
  };

  return animations[animationType] || animations.fade;
}

/**
 * Get entry animation animate state
 */
function getEntryAnimate(animationType) {
  const animations = {
    fade: { opacity: 1 },
    scale: { opacity: 1, scale: 1 },
    slideInLeft: { opacity: 1, x: 0 },
    slideInRight: { opacity: 1, x: 0 },
    slideInTop: { opacity: 1, y: 0 },
    slideInBottom: { opacity: 1, y: 0 },
    bounce: { opacity: 1, scale: 1, y: 0 },
    flip: { opacity: 1, rotateY: 0 },
    spin: { opacity: 1, rotate: 0, scale: 1 },
    zoom: { opacity: 1, scale: 1 },
    elastic: { opacity: 1, scale: 1 },
    shake: { opacity: 1, x: 0 },
    // Combination animations
    bounceRotate: { opacity: 1, scale: 1, y: 0, rotate: 0 },
    slideScale: { opacity: 1, x: 0, scale: 1 },
    flipSlide: { opacity: 1, rotateY: 0, x: 0 },
    spinZoom: { opacity: 1, rotate: 0, scale: 1 },
    shakeScale: { opacity: 1, x: 0, scale: 1 },
    slideRotate: { opacity: 1, x: 0, rotate: 0 }
  };

  return animations[animationType] || animations.fade;
}

/**
 * Get exit animation state
 */
function getExitState(animationType) {
  const animations = {
    fade: { opacity: 0 },
    scale: { opacity: 0, scale: 0.8 },
    slideOutLeft: { opacity: 0, x: '-100vw' },
    slideOutRight: { opacity: 0, x: '100vw' },
    slideOutTop: { opacity: 0, y: '-100vh' },
    slideOutBottom: { opacity: 0, y: '100vh' },
    shrink: { opacity: 0, scale: 0 },
    spinOut: { opacity: 0, rotate: 180, scale: 0.5 },
    zoomOut: { opacity: 0, scale: 2 },
    // Combination animations
    bounceRotateOut: { opacity: 0, scale: 0.3, y: 100, rotate: 180 },
    slideScaleOut: { opacity: 0, x: '100vw', scale: 0.5 },
    flipSlideOut: { opacity: 0, rotateY: 90, x: '-50vw' },
    spinZoomOut: { opacity: 0, rotate: 360, scale: 2 },
    shakeScaleOut: { opacity: 0, x: 50, scale: 0.5 },
    slideRotateOut: { opacity: 0, x: '100vw', rotate: 90 }
  };

  return animations[animationType] || animations.fade;
}

/**
 * Get easing configuration for Framer Motion
 */
function getEasingConfig(easingType) {
  const easings = {
    linear: { ease: [0, 0, 1, 1] },
    easeIn: { ease: [0.4, 0, 1, 1] },
    easeOut: { ease: [0, 0, 0.2, 1] },
    easeInOut: { ease: [0.4, 0, 0.2, 1] },
    spring: { type: 'spring', stiffness: 300, damping: 20 },
    bounce: { type: 'spring', stiffness: 400, damping: 10 },
    anticipate: { type: 'spring', stiffness: 200, damping: 15 }
  };

  return easings[easingType] || easings.easeInOut;
}

/**
 * Generate complete animation variants for Framer Motion
 * 
 * @param {string} entry - Entry animation type
 * @param {string} exit - Exit animation type
 * @param {string} easing - Easing function type
 * @returns {object} Framer Motion variants object
 */
export function getAnimationVariants(entry, exit, easing = 'easeInOut') {
  return {
    initial: getEntryInitial(entry),
    animate: getEntryAnimate(entry),
    exit: getExitState(exit)
  };
}

/**
 * Get transition configuration
 * 
 * @param {number} duration - Duration in milliseconds
 * @param {number} delay - Delay in milliseconds
 * @param {string} easing - Easing type
 * @returns {object} Framer Motion transition config
 */
export function getTransitionConfig(duration = 500, delay = 0, easing = 'easeInOut') {
  const easingConfig = getEasingConfig(easing);
  
  return {
    duration: duration / 1000,
    delay: delay / 1000,
    ...easingConfig
  };
}

// ============================================================================
// POSITION UTILITIES
// ============================================================================

/**
 * Get position styles based on preset or custom position
 * 
 * @param {string} position - Position preset name
 * @param {object} customPosition - Custom position with x and y
 * @returns {object} CSS position styles
 */
export function getPositionStyles(position, customPosition) {
  const presets = {
    center: { 
      top: '50%', 
      left: '50%', 
      transform: 'translate(-50%, -50%)' 
    },
    'top-left': { 
      top: '5%', 
      left: '5%' 
    },
    'top-right': { 
      top: '5%', 
      right: '5%' 
    },
    'bottom-left': { 
      bottom: '5%', 
      left: '5%' 
    },
    'bottom-right': { 
      bottom: '5%', 
      right: '5%' 
    },
    top: { 
      top: '5%', 
      left: '50%', 
      transform: 'translateX(-50%)' 
    },
    bottom: { 
      bottom: '5%', 
      left: '50%', 
      transform: 'translateX(-50%)' 
    },
    left: { 
      top: '50%', 
      left: '5%', 
      transform: 'translateY(-50%)' 
    },
    right: { 
      top: '50%', 
      right: '5%', 
      transform: 'translateY(-50%)' 
    }
  };

  // Use custom position if provided
  if (customPosition) {
    return { 
      top: customPosition.y, 
      left: customPosition.x 
    };
  }

  // Return preset or default to center
  return presets[position] || presets.center;
}

// ============================================================================
// SIZE UTILITIES
// ============================================================================

/**
 * Get size styles based on preset or custom dimensions
 * 
 * @param {string} size - Size preset name
 * @param {string} maxWidth - Custom max width
 * @param {string} maxHeight - Custom max height
 * @returns {object} CSS size styles
 */
export function getSizeStyles(size, maxWidth, maxHeight) {
  const presets = {
    small: { 
      maxWidth: '30vw', 
      maxHeight: '30vh' 
    },
    medium: { 
      maxWidth: '50vw', 
      maxHeight: '50vh' 
    },
    large: { 
      maxWidth: '70vw', 
      maxHeight: '70vh' 
    },
    fullscreen: { 
      width: '100vw', 
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh'
    }
  };

  // Start with preset
  const base = presets[size] || presets.large;
  
  // Override with custom dimensions if provided
  return {
    ...base,
    ...(maxWidth && { maxWidth }),
    ...(maxHeight && { maxHeight })
  };
}

// ============================================================================
// VALIDATION & HELPERS
// ============================================================================

/**
 * Validate animation configuration and log warnings
 * 
 * @param {object} animationConfig - Animation configuration object
 * @returns {boolean} Whether configuration is valid
 */
export function validateAnimationConfig(animationConfig) {
  if (!animationConfig) return true; // No config is valid (uses defaults)

  const validEntryTypes = [
    'fade', 'scale', 'slideInLeft', 'slideInRight', 'slideInTop', 
    'slideInBottom', 'bounce', 'flip', 'spin', 'zoom', 'elastic', 'shake',
    'bounceRotate', 'slideScale', 'flipSlide', 'spinZoom', 'shakeScale', 'slideRotate'
  ];

  const validExitTypes = [
    'fade', 'scale', 'slideOutLeft', 'slideOutRight', 'slideOutTop', 
    'slideOutBottom', 'shrink', 'spinOut', 'zoomOut',
    'bounceRotateOut', 'slideScaleOut', 'flipSlideOut', 'spinZoomOut', 'shakeScaleOut', 'slideRotateOut'
  ];

  const validEasings = [
    'linear', 'easeIn', 'easeOut', 'easeInOut', 'spring', 'bounce', 'anticipate'
  ];

  let isValid = true;

  if (animationConfig.entry && !validEntryTypes.includes(animationConfig.entry)) {
    console.warn(`Invalid entry animation type: "${animationConfig.entry}". Valid types:`, validEntryTypes);
    isValid = false;
  }

  if (animationConfig.exit && !validExitTypes.includes(animationConfig.exit)) {
    console.warn(`Invalid exit animation type: "${animationConfig.exit}". Valid types:`, validExitTypes);
    isValid = false;
  }

  if (animationConfig.easing && !validEasings.includes(animationConfig.easing)) {
    console.warn(`Invalid easing type: "${animationConfig.easing}". Valid types:`, validEasings);
    isValid = false;
  }

  return isValid;
}

/**
 * Validate position configuration
 * 
 * @param {string} position - Position preset
 * @returns {boolean} Whether position is valid
 */
export function validatePosition(position) {
  const validPositions = [
    'center', 'top-left', 'top-right', 'bottom-left', 'bottom-right',
    'top', 'bottom', 'left', 'right'
  ];

  if (position && !validPositions.includes(position)) {
    console.warn(`Invalid position: "${position}". Valid positions:`, validPositions);
    return false;
  }

  return true;
}

/**
 * Validate size configuration
 * 
 * @param {string} size - Size preset
 * @returns {boolean} Whether size is valid
 */
export function validateSize(size) {
  const validSizes = ['small', 'medium', 'large', 'fullscreen'];

  if (size && !validSizes.includes(size)) {
    console.warn(`Invalid size: "${size}". Valid sizes:`, validSizes);
    return false;
  }

  return true;
}

/**
 * Get default animation configuration
 * 
 * @returns {object} Default animation config
 */
export function getDefaultAnimationConfig() {
  return {
    entry: 'fade',
    exit: 'fade',
    duration: 500,
    easing: 'easeInOut',
    delay: 0
  };
}

/**
 * Merge user config with defaults
 * 
 * @param {object} userConfig - User-provided configuration
 * @returns {object} Merged configuration
 */
export function mergeAnimationConfig(userConfig) {
  const defaults = getDefaultAnimationConfig();
  
  if (!userConfig) return defaults;
  
  return {
    entry: userConfig.entry || defaults.entry,
    exit: userConfig.exit || defaults.exit,
    duration: userConfig.duration ?? defaults.duration,
    easing: userConfig.easing || defaults.easing,
    delay: userConfig.delay ?? defaults.delay
  };
}
