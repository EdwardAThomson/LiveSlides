// Import deck configuration
import deckConfig from './deck.json';
import jokesConfig from './jokes.json';

// Import all MDX slides
import * as IntroSlide from './slides/00-intro.mdx';
import * as FeaturesSlide from './slides/01-features.mdx';
import * as DemoSlide from './slides/02-demo.mdx';
import * as OutroSlide from './slides/03-outro.mdx';

// Map slide IDs to their MDX modules
export const mdxModules = {
  intro: IntroSlide,
  features: FeaturesSlide,
  demo: DemoSlide,
  outro: OutroSlide,
};

export const config = deckConfig;
export const jokes = jokesConfig;

export default {
  config,
  mdxModules,
  jokes,
};
