---
phase: 16
plan: 1
wave: 1
---

# Plan 16.1: Animations and Colors Refactor

## Objective
Update the PINVerification component to adhere to the design system (framer-motion for animations, Aurora Forest colors).

## Context
- .gsd/SPEC.md
- client/src/components/auth/PINVerification.jsx

## Tasks

<task type="auto">
  <name>Framer Motion Shake</name>
  <files>
    client/src/components/auth/PINVerification.jsx
  </files>
  <action>
    - Import `motion` from `framer-motion`.
    - Change the container div wrapping the inputs to a `motion.div`.
    - Remove the `<style>` block and raw `@keyframes shake`.
    - Instead, use Framer Motion's `animate` prop on the `motion.div`. When `isError` is true, trigger a horizontal shake (e.g., `animate={isError ? { x: [-5, 5, -5, 5, 0] } : {}}`). Add a small transition duration.
  </action>
  <verify>grep "motion.div" client/src/components/auth/PINVerification.jsx</verify>
  <done>Raw CSS animations are removed in favor of framer-motion.</done>
</task>

<task type="auto">
  <name>Remove Unauthorized Colors</name>
  <files>
    client/src/components/auth/PINVerification.jsx
  </files>
  <action>
    - Search for `text-red-500` and `border-red-500`. Replace them with `text-accent` and `border-accent`.
    - Update outdated `dark-card` or `dark-border` classes to the new design system classes: `bg-surface`, `border-border`, `text-text-dark`, and `text-text-muted`.
  </action>
  <verify>grep -v "red-500" client/src/components/auth/PINVerification.jsx | wc -l</verify>
  <done>No red-500 classes remain in the component.</done>
</task>

## Success Criteria
- [ ] Framer motion used for shake effect.
- [ ] Colors conform to the Aurora Forest palette.
