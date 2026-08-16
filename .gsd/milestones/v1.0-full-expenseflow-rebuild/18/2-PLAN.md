---
phase: 18
plan: 2
wave: 2
---

# Plan 18.2: Scrolling, Transitions & Color Purge

## Objective
Enforce mobile-first constraints: remove horizontal scrolling, add page transitions, and delete all unauthorized red colors.

## Context
- .gsd/SPEC.md
- client/src/pages/FairnessReport.jsx
- client/src/components/auth/GuestJoinModal.jsx
- client/src/components/AppLayout.jsx

## Tasks

<task type="auto">
  <name>Mobile Layout & Scrolling</name>
  <files>
    client/src/pages/FairnessReport.jsx
  </files>
  <action>
    - Ensure charts, tables, and grids fit inside a 390px viewport. 
    - In `FairnessReport.jsx`, convert wide tables into stacked cards or scroll-free formats on mobile (`block md:table`, or similar responsive flex layouts) to eliminate horizontal scrolling.
  </action>
  <verify>grep "block md:table" client/src/pages/FairnessReport.jsx || grep "flex-col" client/src/pages/FairnessReport.jsx</verify>
  <done>No horizontal scrolling is required on mobile devices.</done>
</task>

<task type="auto">
  <name>Transitions and Colors</name>
  <files>
    client/src/components/AppLayout.jsx
    client/src/components/auth/GuestJoinModal.jsx
  </files>
  <action>
    - In `AppLayout.jsx`, wrap the main content area in an `AnimatePresence` and a `motion.div` that implements slide-up enter and fade-out exit transitions. Use `location.pathname` as the key.
    - In `GuestJoinModal.jsx` and any other component, replace any `text-red-500` or similar red colors with `--text-muted` (using `text-text-muted`) or `text-accent`.
  </action>
  <verify>! grep "text-red" client/src/components/auth/GuestJoinModal.jsx</verify>
  <done>Page transitions work and no red colors exist.</done>
</task>

## Success Criteria
- [ ] Tables do not cause horizontal scrolling on mobile.
- [ ] Slide-up enter / fade-out exit transitions are implemented.
- [ ] No red colors exist anywhere in the UI.
