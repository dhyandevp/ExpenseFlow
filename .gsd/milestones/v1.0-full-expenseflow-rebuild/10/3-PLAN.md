---
phase: 10
plan: 3
wave: 2
---

# Plan 10.3: Desktop Hover States & Staggered Animations

## Objective
Implement Framer Motion interactions tailored for desktop cursors. Add subtle hover states (scale-ups, background color shifts) to rows and cards, and introduce staggered entrance animations for lists and charts.

## Context
- .gsd/ROADMAP.md
- client/src/utils/motion.js
- client/src/pages/Dashboard.jsx

## Tasks

<task type="auto">
  <name>Define Desktop Motion Variants</name>
  <files>
    client/src/utils/motion.js
  </files>
  <action>
    - Add a `hoverScale` variant for desktop items using spring animations (e.g., `whileHover: { scale: 1.02 }`).
    - Add a `staggerContainer` variant using `transition: { staggerChildren: 0.1 }` for list reveals.
  </action>
  <verify>grep "hoverScale" client/src/utils/motion.js</verify>
  <done>Desktop-specific motion variants exist.</done>
</task>

<task type="auto">
  <name>Apply Stagger and Hover to Dashboard</name>
  <files>
    client/src/pages/Dashboard.jsx
    client/src/components/SettlementHistory.jsx
  </files>
  <action>
    - Wrap the main feed and balance cards in `motion.div` using the `staggerContainer` variant.
    - Apply `hoverScale` or subtle `whileHover={{ backgroundColor: "var(--highlight)" }}` to list rows (expenses, settlements).
  </action>
  <verify>grep "staggerContainer" client/src/pages/Dashboard.jsx</verify>
  <done>Lists animate in sequentially and rows react to cursor hover.</done>
</task>

## Success Criteria
- [ ] Dashboard lists animate sequentially on load.
- [ ] Interactive elements provide visual feedback (scale/color) on hover.
