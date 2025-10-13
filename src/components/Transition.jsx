import { motion, AnimatePresence } from 'framer-motion';

const transitionVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.4, ease: 'easeInOut' }
  },
  slide: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
    transition: { duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }
  },
  scale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.1 },
    transition: { duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }
  },
  slideUp: {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 },
    transition: { duration: 0.5, type: 'spring', stiffness: 100, damping: 15 }
  }
};

export default function Transition({ kind = 'fade', active, children }) {
  const variant = transitionVariants[kind] || transitionVariants.fade;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center p-16"
      initial={variant.initial}
      animate={variant.animate}
      exit={variant.exit}
      transition={variant.transition}
    >
      {children}
    </motion.div>
  );
}
