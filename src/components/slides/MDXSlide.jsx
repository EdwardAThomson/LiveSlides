import { motion } from 'framer-motion';
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
      <motion.div 
        className="w-full text-white"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Component components={mdxComponents} />
      </motion.div>
    </SlideLayout>
  );
}
