import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const THEME_KEY = "expenseflow_theme";

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {}
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

// ponytail: single global theme state via DOM attribute + localStorage.
// Upgrade to React context if multiple components need to reactively read theme.
let listeners = new Set();
let currentTheme = getInitialTheme();
applyTheme(currentTheme);

function setTheme(theme) {
  currentTheme = theme;
  applyTheme(theme);
  listeners.forEach((fn) => fn(theme));
}

function useTheme() {
  const [theme, setLocal] = useState(currentTheme);
  useEffect(() => {
    listeners.add(setLocal);
    return () => listeners.delete(setLocal);
  }, []);
  return [theme, setTheme];
}

/**
 * Animated sun/moon toggle — pill shape with a sliding orb.
 * Sun rays animate out in light mode; moon has a crescent cutout in dark mode.
 */
export default function ThemeToggle({ size = "md" }) {
  const [theme, toggle] = useTheme();
  const isDark = theme === "dark";

  const dims = size === "sm" ? { w: 44, h: 24, orb: 16, pad: 4 } : { w: 50, h: 26, orb: 18, pad: 4 };

  return (
    <button
      onClick={() => toggle(isDark ? "light" : "dark")}
      className="group relative rounded-full transition-colors duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
      style={{
        width: dims.w,
        height: dims.h,
        background: isDark
          ? "linear-gradient(135deg, #0F1A14 0%, #1A2E22 100%)"
          : "linear-gradient(135deg, #B3EDA9 0%, #EBFADB 100%)",
        border: `1.5px solid var(--border)`,
      }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Stars (dark mode only) */}
      <motion.span
        className="absolute"
        style={{ top: 5, left: 7, width: 2, height: 2, borderRadius: "50%", background: "#ECF3EE" }}
        animate={{ opacity: isDark ? 1 : 0, scale: isDark ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      <motion.span
        className="absolute"
        style={{ top: 13, left: 12, width: 1.5, height: 1.5, borderRadius: "50%", background: "#A3B5A9" }}
        animate={{ opacity: isDark ? 1 : 0, scale: isDark ? 1 : 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      />
      <motion.span
        className="absolute"
        style={{ top: 6, left: 16, width: 1.5, height: 1.5, borderRadius: "50%", background: "#ECF3EE" }}
        animate={{ opacity: isDark ? 1 : 0, scale: isDark ? 1 : 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      />

      {/* Sliding orb */}
      <motion.div
        className="absolute rounded-full shadow-sm"
        style={{
          width: dims.orb,
          height: dims.orb,
          top: dims.pad,
        }}
        animate={{
          left: isDark ? dims.w - dims.orb - dims.pad : dims.pad,
          background: isDark ? "#ECF3EE" : "#FFCC33",
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {/* Sun rays (light mode) */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <motion.span
            key={deg}
            className="absolute"
            style={{
              width: 1.5,
              height: 3,
              borderRadius: 1,
              background: "#FFAA00",
              left: "50%",
              top: "50%",
              transformOrigin: "center center",
            }}
            animate={{
              opacity: isDark ? 0 : 0.8,
              transform: isDark
                ? `translate(-50%, -50%) rotate(${deg}deg) translateY(0px)`
                : `translate(-50%, -50%) rotate(${deg}deg) translateY(-${dims.orb * 0.58}px)`,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25, delay: isDark ? 0 : 0.1 }}
          />
        ))}

        {/* Moon crescent (dark mode) — overlay circle */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: dims.orb * 0.7,
            height: dims.orb * 0.7,
            top: -1,
            right: 0,
          }}
          animate={{
            background: isDark ? "#0F1A14" : "transparent",
            opacity: isDark ? 1 : 0,
            x: isDark ? 0 : 6,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
      </motion.div>
    </button>
  );
}

export { useTheme };
