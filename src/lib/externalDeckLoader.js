/**
 * External Deck Loader - Loads decks from filesystem with runtime MDX compilation
 * Only works in Tauri desktop mode
 */

// Note: We use simple markdown rendering for external decks
// Runtime MDX compilation was removed due to complexity issues
import React from 'react';

// Check if running in Tauri
const isTauri = () => typeof window !== 'undefined' && window.__TAURI_INTERNALS__;

/**
 * Parse frontmatter from MDX content
 * @param {string} mdxContent - Raw MDX string
 * @returns {{frontmatter: object, content: string}}
 */
function parseFrontmatter(mdxContent) {
  let frontmatter = {};
  let content = mdxContent;
  
  const frontmatterMatch = mdxContent.match(/^---\n([\s\S]*?)\n---\n/);
  if (frontmatterMatch) {
    content = mdxContent.slice(frontmatterMatch[0].length);
    // Simple frontmatter parsing (handles notes: "..." format)
    const fmLines = frontmatterMatch[1].split('\n');
    for (const line of fmLines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim();
        let value = line.slice(colonIdx + 1).trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        frontmatter[key] = value;
      }
    }
  }
  
  return { frontmatter, content };
}

/**
 * Convert simple markdown to HTML-like structure for rendering
 * This is a fallback when full MDX compilation isn't needed
 * @param {string} content - Markdown content
 * @returns {string} HTML string
 */
function markdownToHtml(content) {
  return content
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Paragraphs (lines with content)
    .replace(/^(?!<[hlopuc]|$)(.+)$/gm, '<p>$1</p>')
    // Wrap consecutive li elements in ul
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
}

/**
 * Create a simple React component from markdown content
 * @param {string} markdownContent - Markdown string (without frontmatter)
 * @returns {Function} React component
 */
function createSimpleComponent(markdownContent) {
  const html = markdownToHtml(markdownContent);
  
  // Return a functional component that renders the HTML
  // Must accept components prop for compatibility with MDXSlide
  return function SimpleSlide(props) {
    // Ignore the components prop - we render raw HTML
    return React.createElement('div', {
      className: 'prose prose-invert max-w-4xl mx-auto p-8',
      dangerouslySetInnerHTML: { __html: html },
    });
  };
}

/**
 * Compile MDX content to a React component
 * For external decks, we use simple markdown rendering (no JSX components)
 * @param {string} mdxContent - Raw MDX string
 * @returns {Promise<{Component: Function, frontmatter: object, html: string}>}
 */
async function compileMDX(mdxContent) {
  const { frontmatter, content } = parseFrontmatter(mdxContent);
  
  // Use simple markdown rendering for external decks
  // Runtime MDX compilation is complex and error-prone
  // This approach supports standard markdown: headers, bold, italic, lists, code
  console.log('[ExternalDeckLoader] Converting markdown to component');
  const html = markdownToHtml(content);
  const Component = createSimpleComponent(content);
  
  // Return HTML as well so it can be serialized for audience window
  return { Component, frontmatter, html };
}

/**
 * Load an external deck from the filesystem
 * @param {string} deckPath - Absolute path to the deck folder
 * @returns {Promise<{config: object, slides: array, mdxModules: object}>}
 */
export async function loadExternalDeck(deckPath) {
  if (!isTauri()) {
    throw new Error('External deck loading only available in Tauri mode');
  }
  
  console.log('[ExternalDeckLoader] Loading deck from:', deckPath);
  
  const { readTextFile, readDir } = await import('@tauri-apps/plugin-fs');
  const { join } = await import('@tauri-apps/api/path');
  const { convertFileSrc } = await import('@tauri-apps/api/core');
  
  // Load deck.json
  const deckJsonPath = await join(deckPath, 'deck.json');
  const configContent = await readTextFile(deckJsonPath);
  const config = JSON.parse(configContent);
  
  console.log('[ExternalDeckLoader] Loaded config:', config.name || 'Unnamed');
  
  // Process each slide
  const slides = [];
  const mdxModules = {};
  
  for (const slideDef of config.slides) {
    if (slideDef.src && slideDef.src.endsWith('.mdx')) {
      // Load and compile MDX slide
      try {
        const mdxPath = await join(deckPath, slideDef.src);
        const mdxContent = await readTextFile(mdxPath);
        
        console.log('[ExternalDeckLoader] Compiling MDX:', slideDef.id);
        const { Component, frontmatter, html } = await compileMDX(mdxContent);
        
        // Store in mdxModules for compatibility with existing processDeck
        mdxModules[slideDef.id] = {
          default: Component,
          frontmatter,
        };
        
        slides.push({
          id: slideDef.id,
          type: 'mdx',
          Component,
          layout: slideDef.layout || 'center',
          notes: frontmatter.notes || '',
          frontmatter,
          // Store HTML for serialization to audience window
          html: `<div class="prose prose-invert max-w-4xl mx-auto p-8">${html}</div>`,
        });
      } catch (error) {
        console.error('[ExternalDeckLoader] Error loading slide:', slideDef.id, error);
        slides.push({
          id: slideDef.id,
          type: 'error',
          error: `Failed to load slide: ${error.message}`,
        });
      }
    } else {
      // JSON-defined slide (image, youtube, iframe, etc.)
      slides.push({
        ...slideDef,
        layout: slideDef.layout || 'center',
      });
    }
  }
  
  // Process asset URLs - convert local paths to Tauri asset URLs
  const processedSlides = slides.map(slide => {
    if (slide.src && !slide.src.startsWith('http')) {
      // Convert relative path to absolute Tauri asset URL
      const absolutePath = `${deckPath}/${slide.src.replace(/^\.\//, '')}`;
      slide.src = convertFileSrc(absolutePath);
    }
    return slide;
  });
  
  console.log('[ExternalDeckLoader] Loaded', processedSlides.length, 'slides');
  
  // Load jokes config if present
  let jokes = null;
  try {
    const jokesPath = await join(deckPath, 'jokes.json');
    const jokesContent = await readTextFile(jokesPath);
    jokes = JSON.parse(jokesContent);
    
    // Convert joke asset paths to Tauri URLs
    if (jokes?.jokes) {
      jokes.jokes = jokes.jokes.map(joke => {
        if (joke.src && !joke.src.startsWith('http')) {
          const absolutePath = `${deckPath}/${joke.src.replace(/^\.\//, '')}`;
          joke.src = convertFileSrc(absolutePath);
        }
        return joke;
      });
    }
    console.log('[ExternalDeckLoader] Loaded jokes config');
  } catch (e) {
    // No jokes.json, that's fine
  }
  
  return {
    config,
    slides: processedSlides,
    mdxModules,
    jokes,
    deckPath, // Include path for asset resolution
  };
}

/**
 * Resolve an asset path relative to the deck folder
 * @param {string} deckPath - Base deck folder path
 * @param {string} assetPath - Relative asset path (e.g., "./assets/image.png")
 * @returns {string} Tauri asset URL or original path
 */
export async function resolveExternalAsset(deckPath, assetPath) {
  if (!isTauri() || !deckPath) {
    return assetPath;
  }
  
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath;
  }
  
  const { convertFileSrc } = await import('@tauri-apps/api/core');
  const cleanPath = assetPath.replace(/^\.\//, '');
  const absolutePath = `${deckPath}/${cleanPath}`;
  
  return convertFileSrc(absolutePath);
}
