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

import { DEFAULT_OVERLAY as DEFAULT_CONFIG } from '../lib/overlaySettings';

export default function CameraOverlay({ config, visible = true }) {
  // Hidden via the C toggle, or explicitly disabled in the config.
  if (!visible || config?.enabled === false) {
    return null;
  }

  // Use provided config or default
  const effectiveConfig = config?.enabled ? config : DEFAULT_CONFIG;

  const {
    position = 'bottom-left',
    width = '420px',
    height = '240px',
    borderRadius = '12px',
    gradient = true,
    gradientColors = ['#8b5cf6', '#ec4899', '#f59e0b'],
    backgroundColor = '#000000',
    opacity = 1,
    margin = '0px',
    border = false,
    borderColor = 'rgba(255, 255, 255, 0.7)',
    borderWidth = '3px',
  } = effectiveConfig;

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

  // Add gradient fill if enabled (otherwise the solid backgroundColor masks the
  // region — black on a dark slide reads as invisible, which is why a border is
  // useful to keep the camera region marked).
  if (gradient) {
    const gradientString = gradientColors.join(', ');
    style.background = `linear-gradient(135deg, ${gradientString})`;
  }

  // Optional outline — keeps the camera region visible regardless of fill.
  if (border) {
    style.border = `${borderWidth} solid ${borderColor}`;
  }

  return <div style={style} />;
}
