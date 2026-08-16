---
phase: 16
plan: 2
wave: 2
---

# Plan 16.2: State Logic & Accessibility

## Objective
Implement attempt lockout logic and enhance accessibility for screen readers.

## Context
- .gsd/SPEC.md
- client/src/components/auth/PINVerification.jsx

## Tasks

<task type="auto">
  <name>Lockout Logic</name>
  <files>
    client/src/components/auth/PINVerification.jsx
  </files>
  <action>
    - Add a `useState` for tracking `attempts`.
    - Use a `useEffect` that listens to changes in `isError`. If `isError` becomes true, increment `attempts`.
    - If `attempts >= 3`, call `setPin("")` (assuming pin is a prop, wait, actually just pass `""`), reset `attempts` to 0, and focus the first input field to clear state.
  </action>
  <verify>grep "attempts" client/src/components/auth/PINVerification.jsx</verify>
  <done>Inputs clear automatically after 3 failed attempts.</done>
</task>

<task type="auto">
  <name>Accessibility Fixes</name>
  <files>
    client/src/components/auth/PINVerification.jsx
  </files>
  <action>
    - Add `aria-label={\`Digit \${index + 1}\`}` to each `<input>`.
    - Add an `aria-live="polite"` or `aria-live="assertive"` region (e.g. a visually hidden span or a paragraph below) that announces the error state to screen readers when `isError` is true.
  </action>
  <verify>grep "aria-live" client/src/components/auth/PINVerification.jsx</verify>
  <done>Screen readers can navigate inputs and hear errors.</done>
</task>

## Success Criteria
- [ ] Attempt tracking works and resets after 3 failures.
- [ ] aria-labels and aria-live regions are present.
