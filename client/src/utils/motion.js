/**
 * Shared Framer Motion variants for consistent UI animation
 */

export const pageTransition = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { type: "spring", stiffness: 260, damping: 20 }
};

export const expandingCard = {
  layout: true,
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { type: "spring", stiffness: 300, damping: 24 }
};

export const springScale = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
  transition: { type: "spring", stiffness: 400, damping: 17 }
};

export const sheetSlide = {
  initial: { y: "100%", opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: "100%", opacity: 0 },
  transition: { type: "spring", damping: 25, stiffness: 300 }
};

export const listItem = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
  transition: { duration: 0.2 }
};

export const hoverScale = {
  whileHover: { scale: 1.02, backgroundColor: "var(--highlight)", transition: { duration: 0.2 } },
  transition: { type: "spring", stiffness: 400, damping: 17 }
};

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const modalSpring = {
  initial: { scale: 0.9, opacity: 0, y: 20 },
  animate: { scale: 1, opacity: 1, y: 0 },
  exit: { scale: 0.9, opacity: 0, y: 20 },
  transition: { type: "spring", stiffness: 300, damping: 24 }
};
