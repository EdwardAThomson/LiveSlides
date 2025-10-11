/**
 * Process a deck configuration with pre-imported MDX modules
 * @param {object} config - Deck configuration
 * @param {object} mdxModules - Object mapping slide IDs to MDX modules
 * @returns {array} - Processed slides array
 */
export function processDeck(config, mdxModules = {}) {
  const slides = config.slides.map((slideDef) => {
    // If it's an MDX slide, use the pre-imported module
    if (slideDef.src && slideDef.src.endsWith('.mdx')) {
      const mdxModule = mdxModules[slideDef.id];
      
      if (!mdxModule) {
        return {
          id: slideDef.id,
          type: 'error',
          error: `MDX module not found for slide: ${slideDef.id}`,
        };
      }

      return {
        id: slideDef.id,
        type: 'mdx',
        Component: mdxModule.default,
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
