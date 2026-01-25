// Test script to check MDX module structure
import DeliverablesSlide from './src/decks/aiof-consultancy/slides/10-deliverables.mdx';

console.log('=== MDX Module Test ===');
console.log('Module:', DeliverablesSlide);
console.log('Module keys:', Object.keys(DeliverablesSlide));
console.log('Has frontmatter?:', 'frontmatter' in DeliverablesSlide);
console.log('Frontmatter:', DeliverablesSlide.frontmatter);
console.log('Default export:', DeliverablesSlide.default);
