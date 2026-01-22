/**
 * Deck Registry - Manages external deck references stored in ~/Documents/LiveSlides/registry.json
 * Only works in Tauri desktop mode
 */

const REGISTRY_DIR = 'LiveSlides';
const REGISTRY_FILE = 'registry.json';

// Check if running in Tauri
const isTauri = () => typeof window !== 'undefined' && window.__TAURI_INTERNALS__;

/**
 * Get the full path to the registry file
 */
async function getRegistryPath() {
  if (!isTauri()) return null;
  
  const { documentDir, join } = await import('@tauri-apps/api/path');
  const docDir = await documentDir();
  return await join(docDir, REGISTRY_DIR, REGISTRY_FILE);
}

/**
 * Get the LiveSlides directory path
 */
async function getLiveSlidesDir() {
  if (!isTauri()) return null;
  
  const { documentDir, join } = await import('@tauri-apps/api/path');
  const docDir = await documentDir();
  return await join(docDir, REGISTRY_DIR);
}

/**
 * Ensure the LiveSlides directory exists
 */
async function ensureRegistryDir() {
  if (!isTauri()) return;
  
  const { exists, mkdir } = await import('@tauri-apps/plugin-fs');
  const dirPath = await getLiveSlidesDir();
  
  if (!(await exists(dirPath))) {
    await mkdir(dirPath, { recursive: true });
    console.log('[DeckRegistry] Created LiveSlides directory:', dirPath);
  }
}

/**
 * Load the deck registry from disk
 * @returns {Promise<{version: number, decks: Array}>}
 */
export async function loadRegistry() {
  if (!isTauri()) {
    console.log('[DeckRegistry] Not in Tauri mode, returning empty registry');
    return { version: 1, decks: [] };
  }
  
  try {
    const { readTextFile, exists } = await import('@tauri-apps/plugin-fs');
    const registryPath = await getRegistryPath();
    
    if (!(await exists(registryPath))) {
      console.log('[DeckRegistry] Registry file not found, returning empty registry');
      return { version: 1, decks: [] };
    }
    
    const content = await readTextFile(registryPath);
    const registry = JSON.parse(content);
    console.log('[DeckRegistry] Loaded registry with', registry.decks?.length || 0, 'decks');
    return registry;
  } catch (error) {
    console.error('[DeckRegistry] Error loading registry:', error);
    return { version: 1, decks: [] };
  }
}

/**
 * Save the deck registry to disk
 * @param {object} registry - The registry object to save
 */
export async function saveRegistry(registry) {
  if (!isTauri()) {
    console.warn('[DeckRegistry] Cannot save registry - not in Tauri mode');
    return;
  }
  
  try {
    await ensureRegistryDir();
    
    const { writeTextFile } = await import('@tauri-apps/plugin-fs');
    const registryPath = await getRegistryPath();
    
    await writeTextFile(registryPath, JSON.stringify(registry, null, 2));
    console.log('[DeckRegistry] Saved registry');
  } catch (error) {
    console.error('[DeckRegistry] Error saving registry:', error);
    throw error;
  }
}

/**
 * Validate that a folder contains a valid deck (has deck.json)
 * @param {string} deckPath - Path to the deck folder
 * @returns {Promise<{valid: boolean, config?: object, error?: string}>}
 */
export async function validateDeckFolder(deckPath) {
  if (!isTauri()) {
    return { valid: false, error: 'Not in Tauri mode' };
  }
  
  console.log('[DeckRegistry] Validating deck folder:', deckPath);
  
  try {
    const { readTextFile, exists } = await import('@tauri-apps/plugin-fs');
    const { join } = await import('@tauri-apps/api/path');
    
    const deckJsonPath = await join(deckPath, 'deck.json');
    console.log('[DeckRegistry] Looking for deck.json at:', deckJsonPath);
    
    const fileExists = await exists(deckJsonPath);
    console.log('[DeckRegistry] deck.json exists:', fileExists);
    
    if (!fileExists) {
      return { valid: false, error: `No deck.json found in folder: ${deckPath}` };
    }
    
    const content = await readTextFile(deckJsonPath);
    console.log('[DeckRegistry] deck.json content:', content.substring(0, 200));
    
    const config = JSON.parse(content);
    
    // Basic validation
    if (!config.slides || !Array.isArray(config.slides)) {
      return { valid: false, error: 'deck.json missing slides array' };
    }
    
    console.log('[DeckRegistry] Deck validated successfully:', config.name || 'unnamed');
    return { valid: true, config };
  } catch (error) {
    console.error('[DeckRegistry] Validation error:', error);
    return { valid: false, error: `Invalid deck: ${error.message || error}` };
  }
}

/**
 * Add a deck folder to the registry
 * @param {string} deckPath - Path to the deck folder
 * @returns {Promise<{success: boolean, deck?: object, error?: string}>}
 */
export async function addDeckToRegistry(deckPath) {
  console.log('[DeckRegistry] Adding deck from path:', deckPath);
  
  // Validate the deck first
  const validation = await validateDeckFolder(deckPath);
  console.log('[DeckRegistry] Validation result:', validation);
  
  if (!validation.valid) {
    return { success: false, error: validation.error || 'Unknown validation error' };
  }
  
  try {
    const registry = await loadRegistry();
    
    // Check if deck is already registered
    const existingIndex = registry.decks.findIndex(d => d.path === deckPath);
    if (existingIndex >= 0) {
      // Update existing entry
      registry.decks[existingIndex].lastOpened = new Date().toISOString();
      registry.decks[existingIndex].name = validation.config.name || registry.decks[existingIndex].name;
      await saveRegistry(registry);
      console.log('[DeckRegistry] Updated existing deck:', registry.decks[existingIndex].name);
      return { success: true, deck: registry.decks[existingIndex] };
    }
    
    // Extract folder name for default name
    const folderName = deckPath.split('/').pop() || 'Untitled';
    
    // Create new deck entry
    const newDeck = {
      id: crypto.randomUUID(),
      name: validation.config.name || folderName,
      path: deckPath,
      lastOpened: new Date().toISOString(),
    };
    
    registry.decks.push(newDeck);
    await saveRegistry(registry);
    
    console.log('[DeckRegistry] Added deck:', newDeck.name);
    return { success: true, deck: newDeck };
  } catch (error) {
    console.error('[DeckRegistry] Error adding deck:', error);
    return { success: false, error: error.message || 'Failed to save deck to registry' };
  }
}

/**
 * Remove a deck from the registry
 * @param {string} deckId - The deck ID to remove
 */
export async function removeDeckFromRegistry(deckId) {
  try {
    const registry = await loadRegistry();
    registry.decks = registry.decks.filter(d => d.id !== deckId);
    await saveRegistry(registry);
    console.log('[DeckRegistry] Removed deck:', deckId);
  } catch (error) {
    console.error('[DeckRegistry] Error removing deck:', error);
    throw error;
  }
}

/**
 * Update the lastOpened timestamp for a deck
 * @param {string} deckId - The deck ID to update
 */
export async function updateDeckLastOpened(deckId) {
  try {
    const registry = await loadRegistry();
    const deck = registry.decks.find(d => d.id === deckId);
    if (deck) {
      deck.lastOpened = new Date().toISOString();
      await saveRegistry(registry);
    }
  } catch (error) {
    console.error('[DeckRegistry] Error updating deck timestamp:', error);
  }
}

/**
 * Open a folder picker dialog to select a deck folder
 * @returns {Promise<string|null>} The selected folder path or null if cancelled
 */
export async function openDeckFolderDialog() {
  if (!isTauri()) {
    console.warn('[DeckRegistry] Cannot open folder dialog - not in Tauri mode');
    return null;
  }
  
  try {
    const { open } = await import('@tauri-apps/plugin-dialog');
    
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Select Deck Folder',
    });
    
    return selected || null;
  } catch (error) {
    console.error('[DeckRegistry] Error opening folder dialog:', error);
    return null;
  }
}
