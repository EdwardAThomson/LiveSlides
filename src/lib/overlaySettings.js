/**
 * Camera-overlay settings: shared default, plus a per-deck override layer.
 *
 * Persistence model (hybrid): deck.json provides the default; runtime edits are
 * saved per-deck in localStorage and win on load. This works for every deck
 * (bundled + external) in both web and Tauri. In Tauri, an external deck can
 * additionally bake the current settings into its own deck.json (see
 * saveOverlayToDeckFile in externalDeckRegistry.js) so they travel with the
 * deck folder.
 */

// Single source of truth for the default overlay shape.
export const DEFAULT_OVERLAY = {
  enabled: true,
  position: 'bottom-left',
  width: '420px',
  height: '240px',
  borderRadius: '12px',
  gradient: true,
  gradientColors: ['#8b5cf6', '#ec4899', '#f59e0b'], // purple -> pink -> amber
  backgroundColor: '#000000',
  opacity: 1,
  margin: '0px',
  border: false,
  borderColor: 'rgba(255, 255, 255, 0.7)',
  borderWidth: '3px',
};

const PREFIX = 'liveslides:overlay:';

/**
 * Read a deck's saved overlay override.
 * @param {string} deckId
 * @returns {object|null} the stored overlay config, or null if none
 */
export function loadOverlayOverride(deckId) {
  if (!deckId || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PREFIX + deckId);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('[overlaySettings] Failed to read override:', e);
    return null;
  }
}

/**
 * Save a deck's overlay override.
 * @param {string} deckId
 * @param {object} overlay - full overlay config
 */
export function saveOverlayOverride(deckId, overlay) {
  if (!deckId || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(PREFIX + deckId, JSON.stringify(overlay));
  } catch (e) {
    console.error('[overlaySettings] Failed to save override:', e);
  }
}

/**
 * Remove a deck's overlay override (revert to the deck.json default).
 * @param {string} deckId
 */
export function clearOverlayOverride(deckId) {
  if (!deckId || typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(PREFIX + deckId);
  } catch (e) {
    console.error('[overlaySettings] Failed to clear override:', e);
  }
}

/**
 * Resolve the effective overlay for a deck: saved override wins over the
 * deck.json default; if neither exists, fall back to DEFAULT_OVERLAY.
 * @param {object|null} deckDefault - the deck.json cameraOverlay (or null)
 * @param {string} deckId
 */
export function resolveOverlay(deckDefault, deckId) {
  return loadOverlayOverride(deckId) || deckDefault || DEFAULT_OVERLAY;
}

/**
 * Parse a CSS px value (e.g. "420px") to a number. Accepts plain numbers too.
 * @param {string|number} value
 * @param {number} fallback
 */
export function pxToNum(value, fallback = 0) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}
