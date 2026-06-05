/**
 * Single source of truth for the bundled decks.
 *
 * Display metadata lives here; slide content is loaded on demand via a dynamic
 * import so a deck folder that isn't present locally simply fails to load at
 * runtime instead of breaking the build. Both the presenter view (App.jsx) and
 * the audience view (AudienceView.jsx) consume this list.
 *
 * To add a bundled deck: drop a folder under src/decks/<id>/ (with deck.json +
 * index.js) and add one entry here. No other files need to change.
 */
export const availableDecks = [
  { id: 'quick-demo', name: 'Quick Demo', icon: '⚡', description: 'Fast overview of features' },
  { id: 'vibe-coding', name: 'Vibe Coding Process', icon: '🤖', description: 'AI-assisted development workflow' },
  { id: 'my-presentation', name: 'My Presentation', icon: '📝', description: 'Custom presentation deck' },
  { id: 'demo-deck', name: 'MDX Examples', icon: '🎨', description: 'MDX components showcase' },
  { id: 'ai-frameworks', name: 'AI Frameworks', icon: '🤖', description: 'AI Opportunity & Risk Management' },
  { id: 'aiof-consultancy', name: 'AI Adoption Framework', icon: '📊', description: 'SME AI Opportunity Discovery' },
  { id: 'aiof-visual', name: 'AIOF (Visual Version)', icon: '🖼️', description: 'Minimalist pitch deck' },
];

/**
 * Whether the given id refers to a bundled deck (vs an external/filesystem deck).
 * @param {string} id
 * @returns {boolean}
 */
export const isBundledDeck = (id) => availableDecks.some((d) => d.id === id);

/**
 * Dynamically import a bundled deck's module.
 * @param {string} id - Deck id (folder name under src/decks/)
 * @returns {Promise<{config: object, mdxModules: object, jokes?: object}>}
 */
export async function loadDeck(id) {
  const module = await import(`./${id}/index.js`);
  return module.default;
}
