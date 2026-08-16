---
phase: 6
plan: 2
wave: 2
---

# Plan 6.2: Core Layout Redesign

## Objective
Redesign the primary layouts (AppLayout, Landing, GroupSetup) to utilize the mobile-first bottom navigation and glass aesthetics.

## Context
- .gsd/SPEC.md
- client/src/components/AppLayout.jsx
- client/src/pages/Landing.jsx
- client/src/pages/GroupSetup.jsx

## Tasks

<task type="auto">
  <name>Redesign AppLayout</name>
  <files>
    client/src/components/AppLayout.jsx
  </files>
  <action>
    - Transform `AppLayout` into a mobile-first design.
    - Implement a fixed bottom navigation bar containing links to Dashboard, Expenses, Reports, Settings. Apply the `.glass-nav` class to it.
    - Implement a sticky top header with `.glass-header` showing the group name and a back button if applicable.
    - Ensure main content has appropriate padding to avoid overlapping the fixed top/bottom bars.
  </action>
  <verify>grep "glass-nav" client/src/components/AppLayout.jsx</verify>
  <done>AppLayout uses mobile-centric bottom navigation and glass headers.</done>
</task>

<task type="auto">
  <name>Refine Landing & Setup</name>
  <files>
    client/src/pages/Landing.jsx
    client/src/pages/GroupSetup.jsx
  </files>
  <action>
    - In `Landing.jsx`, apply glass styling (`.glass`) to the central hero cards and refine spacing for mobile screens.
    - In `GroupSetup.jsx`, convert the setup flow into wizard step cards that fit neatly within a 390px mobile viewport, utilizing `springScale` for buttons and `pageTransition` between steps.
  </action>
  <verify>grep "glass" client/src/pages/Landing.jsx</verify>
  <done>Landing and Setup flows are fully mobile-responsive with glass styling.</done>
</task>

## Success Criteria
- [ ] AppLayout renders a bottom navigation bar.
- [ ] Wizard and landing views are optimized for mobile viewports.
