import { mdxComponents } from '../../lib/mdxComponents';
import SlideLayout from '../SlideLayout';

export default function MDXSlide({ Component, layout = 'center' }) {
  if (!Component) {
    return (
      <div className="text-red-500 text-center">
        <h2 className="text-3xl font-bold mb-4">Error</h2>
        <p>MDX Component is missing</p>
      </div>
    );
  }

  return (
    <SlideLayout layout={layout}>
      <div className="w-full text-white">
        <Component components={mdxComponents} />
      </div>
    </SlideLayout>
  );
}
