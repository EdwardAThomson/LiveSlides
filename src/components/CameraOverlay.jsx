/**
 * CameraOverlay - Blocks out a region for presenter camera overlay
 * 
 * Renders a shaped overlay (typically bottom-left) that masks the slide content
 * where a camera feed will be placed during recording/streaming.
 * 
 * Features:
 * - Configurable position (bottom-left, bottom-right, top-left, top-right)
 * - Configurable size (width/height)
 * - Optional gradient border effect
 * - Rounded corners to match typical camera feeds
 */

export default function CameraOverlay({ config, visible = true }) {
  // Return null if no camera overlay configured or if hidden
  if (!config || !config.enabled || !visible) {
    return null;
  }

  const {
    position = 'bottom-left',
    width = '420px',
    height = '240px',
    borderRadius = '12px',
    gradient = true,
    gradientColors = ['#8b5cf6', '#ec4899', '#f59e0b'], // purple -> pink -> amber
    backgroundColor = '#000000',
    opacity = 1,
    margin = '0px',
  } = config;

  // Position styles based on config
  const positionStyles = {
    'bottom-left': {
      bottom: margin,
      left: margin,
    },
    'bottom-right': {
      bottom: margin,
      right: margin,
    },
    'top-left': {
      top: margin,
      left: margin,
    },
    'top-right': {
      top: margin,
      right: margin,
    },
  };

  const style = {
    position: 'absolute',
    width,
    height,
    borderRadius,
    backgroundColor,
    opacity,
    zIndex: 40, // Above slide content, below controls (z-50)
    pointerEvents: 'none', // Don't block clicks
    ...positionStyles[position],
  };

  // Add gradient fill if enabled
  if (gradient) {
    const gradientString = gradientColors.join(', ');
    style.background = `linear-gradient(135deg, ${gradientString})`;
  }

  return <div style={style} />;
}
