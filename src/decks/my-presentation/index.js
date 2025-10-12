// Import deck configuration
import deckConfig from './deck.json';
import jokesConfig from './jokes.json';

// Import all MDX slides
import TitleSlide from './slides/01-title.mdx';
import ContentSlide from './slides/02-content.mdx';
import DemoSlide from './slides/03-demo.mdx';
import ClosingSlide from './slides/04-closing.mdx';

// Map slide IDs to their MDX modules
export const mdxModules = {
  title: TitleSlide,
  content: ContentSlide,
  demo: DemoSlide,
  closing: ClosingSlide,
};

export const config = deckConfig;
export const jokes = jokesConfig;

export default {
  config,
  mdxModules,
  jokes,
};
