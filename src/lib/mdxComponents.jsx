import Grid from '../components/mdx-primitives/Grid';
import Block from '../components/mdx-primitives/Block';
import Media from '../components/mdx-primitives/Media';
import Iframe from '../components/mdx-primitives/Iframe';
import YouTube from '../components/mdx-primitives/YouTube';
import Callout from '../components/mdx-primitives/Callout';

// Components available in MDX files
export const mdxComponents = {
  Grid,
  Block,
  Media,
  Iframe,
  YouTube,
  Callout,
  // Standard HTML elements with proper styling
  h1: (props) => <h1 className="text-5xl font-bold mb-6" {...props} />,
  h2: (props) => <h2 className="text-4xl font-bold mb-4" {...props} />,
  h3: (props) => <h3 className="text-3xl font-bold mb-3" {...props} />,
  h4: (props) => <h4 className="text-2xl font-bold mb-2" {...props} />,
  p: (props) => <p className="text-xl mb-4 leading-relaxed" {...props} />,
  ul: (props) => <ul className="list-disc list-outside ml-6 space-y-2 text-xl mb-4" {...props} />,
  ol: (props) => <ol className="list-decimal list-outside ml-6 space-y-2 text-xl mb-4" {...props} />,
  li: (props) => <li className="ml-2" {...props} />,
  strong: (props) => <strong className="font-bold" {...props} />,
  em: (props) => <em className="italic" {...props} />,
  code: (props) => <code className="bg-gray-800 px-2 py-1 rounded text-sm font-mono" {...props} />,
  pre: (props) => <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4" {...props} />,
};
