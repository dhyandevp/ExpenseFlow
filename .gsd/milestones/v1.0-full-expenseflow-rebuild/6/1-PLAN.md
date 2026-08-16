---
phase: 6
plan: 1
wave: 1
---

# Plan 6.1: Global Styles & Motion Presets

## Objective
Establish the foundation for the mobile-first "Liquid Glass" UI by updating CSS tokens and defining reusable Framer Motion animation variants.

## Context
- .gsd/SPEC.md
- client/src/index.css
- client/tailwind.config.js
- client/src/utils/motion.js (to be created)

## Tasks

<task type="auto">
  <name>Configure Glass CSS Tokens</name>
  <files>
    client/src/index.css
    client/tailwind.config.js
  </files>
  <action>
    - In `index.css`, define custom properties for glass effects under a `.glass` utility class: `backdrop-filter: blur(12px); background-color: rgba(235, 250, 219, 0.72); border: 1px solid rgba(194, 203, 201, 0.4);`.
    - Add a performance fallback using `@media (prefers-reduced-transparency: reduce)` that disables the blur and uses a solid fallback color.
    - Add `.glass-nav` and `.glass-header` classes tailored for sticky elements.
  </action>
  <verify>grep "backdrop-filter" client/src/index.css && grep "prefers-reduced-transparency" client/src/index.css</verify>
  <done>Glassmorphism CSS utilities and accessibility fallbacks are defined globally.</done>
</task>

<task type="auto">
  <name>Define Motion Presets</name>
  <files>
    client/src/utils/motion.js
  </files>
  <action>
    - Create `client/src/utils/motion.js`.
    - Export Framer Motion variants:
      - `pageTransition`: slide-up/fade-out 150ms
      - `springScale`: for FABs/buttons (scale 0.95 on tap)
      - `sheetSlide`: slide-up 350ms spring for bottom sheets
  </action>
  <verify>grep "pageTransition" client/src/utils/motion.js</verify>
  <done>Reusable animation configurations are centralized for consistent UI motion.</done>
</task>

## Success Criteria
- [ ] Liquid glass CSS classes are available.
- [ ] Framer Motion presets are exported and ready for consumption.
