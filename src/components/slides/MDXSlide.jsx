import { motion } from 'framer-motion';
import { Component as ReactComponent, useState, useEffect } from 'react';
import { mdxComponents } from '../../lib/mdxComponents';
import SlideLayout from '../SlideLayout';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.43, 0.13, 0.23, 0.96]
    }
  }
};

// Error boundary wrapper for MDX components
function SafeComponent({ Component, components }) {
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null); // Reset error when component changes
  }, [Component]);

  if (error) {
    return (
      <div className="text-red-400 text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Slide Render Error</h2>
        <p className="text-lg">{error.message}</p>
      </div>
    );
  }

  try {
    return <Component components={components} />;
  } catch (err) {
    console.error('[MDXSlide] Error rendering component:', err);
    // Set error state for re-render
    setTimeout(() => setError(err), 0);
    return (
      <div className="text-red-400 text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Slide Render Error</h2>
        <p className="text-lg">{err.message}</p>
      </div>
    );
  }
}

export default function MDXSlide({ Component, layout = 'center' }) {
  if (!Component) {
    return (
      <div className="text-red-500 text-center">
        <h2 className="text-3xl font-bold mb-4">Error</h2>
        <p>MDX Component is missing</p>
      </div>
    );
  }

  console.log('[MDXSlide] Rendering component:', typeof Component, Component?.name || 'anonymous');

  return (
    <SlideLayout layout={layout}>
      <motion.div
        className="w-full"
        style={{ color: 'var(--text-main)' }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <SafeComponent Component={Component} components={mdxComponents} />
      </motion.div>
    </SlideLayout>
  );
}
