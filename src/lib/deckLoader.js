/**
 * Process a deck configuration with pre-imported MDX modules
 * @param {object} config - Deck configuration
 * @param {object} mdxModules - Object mapping slide IDs to MDX modules
 * @returns {array} - Processed slides array
 */
export function processDeck(config, mdxModules = {}) {
  console.log('processDeck called with:', { config, mdxModules });

  const slides = config.slides.map((slideDef) => {
    console.log('Processing slide:', slideDef);

    // If it's an MDX slide, use the pre-imported module
    if (slideDef.src && slideDef.src.endsWith('.mdx')) {
      const mdxModule = mdxModules[slideDef.id];
      console.log(`Looking for MDX module with id "${slideDef.id}":`, mdxModule);

      if (!mdxModule) {
        console.error(`MDX module not found for slide: ${slideDef.id}`);
        console.error('Available modules:', Object.keys(mdxModules));
        return {
          id: slideDef.id,
          type: 'error',
          error: `MDX module not found for slide: ${slideDef.id}. Available: ${Object.keys(mdxModules).join(', ')}`,
        };
      }

      console.log('MDX module found for slide:', slideDef.id);

      // MDX modules can export as default OR as the module itself
      const Component = mdxModule.default || mdxModule;

      return {
        id: slideDef.id,
        type: 'mdx',
        Component: Component,
        layout: slideDef.layout || 'center',
        notes: mdxModule.frontmatter?.notes || '',
        frontmatter: mdxModule.frontmatter || {},
      };
    }

    // Otherwise, it's a JSON-defined slide
    return {
      ...slideDef,
      layout: slideDef.layout || 'center',
    };
  });

  console.log('Processed slides:', slides);
  return slides;
}

/**
 * Resolve asset path relative to deck folder
 * @param {string} deckPath - Base deck path
 * @param {string} assetPath - Relative asset path
 * @returns {string} - Resolved absolute path
 */
export function resolveAssetPath(deckPath, assetPath) {
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath;
  }

  // Remove leading ./ if present
  const cleanPath = assetPath.replace(/^\.\//, '');
  return `${deckPath}/${cleanPath}`;
}
