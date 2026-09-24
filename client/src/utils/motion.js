/**
 * Shared Framer Motion variants — using bounce/duration API per Apple guidelines
 */

export const pageTransition = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { type: "spring", bounce: 0, duration: 0.35 }
};

export const expandingCard = {
  layout: true,
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { type: "spring", bounce: 0.1, duration: 0.3 }
};

export const springScale = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.97 },
  transition: { type: "spring", bounce: 0.15, duration: 0.25 }
};

export const sheetSlide = {
  initial: { y: "100%", opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: "100%", opacity: 0 },
  transition: { type: "spring", bounce: 0.15, duration: 0.3 }
};

export const hoverScale = {
  whileHover: { scale: 1.01, y: -2, backgroundColor: "var(--highlight)", transition: { duration: 0.2 } },
  transition: { type: "spring", bounce: 0.15, duration: 0.25 }
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
  transition: { type: "spring", bounce: 0.15, duration: 0.3 }
};

/**
 * Momentum projection — Apple-style exponential-decay.
 * Given current offset + velocity, projects where the gesture
 * will land if the user lifts their finger.
 * ponytail: for two-state gestures the simple threshold works;
 *           use this when adding multi-stop sheets or carousels.
 */
export function projectMomentum(offset, velocity, { decayRate = 0.998, threshold = 0.5 } = {}) {
  const projectedDisplacement = velocity / -Math.log(decayRate);
  return offset + projectedDisplacement;
}

/**
 * Haptic feedback via Vibration API.
 * Silently no-ops on unsupported browsers / desktop.
 */
export function haptic(pattern = "light") {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  const patterns = {
    light: 10,
    medium: 20,
    heavy: 40,
    success: [10, 50, 10],
    destructive: [15, 30, 40],
  };
  try {
    navigator.vibrate(patterns[pattern] || patterns.light);
  } catch {
    // Vibration API may throw in restrictive contexts
  }
}
