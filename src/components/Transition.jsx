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
  },
  zoom: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.3 },
    transition: { duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }
  },
  flip: {
    initial: { opacity: 0, rotateY: 90 },
    animate: { opacity: 1, rotateY: 0 },
    exit: { opacity: 0, rotateY: -90 },
    transition: { duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }
  },
  blur: {
    initial: { opacity: 0, filter: 'blur(10px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(10px)' },
    transition: { duration: 0.5 }
  },
  rotate: {
    initial: { opacity: 0, rotate: -10, scale: 0.9 },
    animate: { opacity: 1, rotate: 0, scale: 1 },
    exit: { opacity: 0, rotate: 10, scale: 0.9 },
    transition: { duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }
  },
  bounce: {
    initial: { opacity: 0, y: -100 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 100 },
    transition: { 
      duration: 0.8, 
      type: 'spring', 
      stiffness: 200, 
      damping: 10 
    }
  },
  slideDown: {
    initial: { opacity: 0, y: -50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 },
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
