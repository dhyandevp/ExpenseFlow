---
phase: 18
plan: 1
wave: 1
---

# Plan 18.1: Mobile Navigation and Layout

## Objective
Enforce strict mobile navigation components including a 4-tab bottom nav, sticky top header with auth badge, and FAB.

## Context
- .gsd/SPEC.md
- client/src/components/AppLayout.jsx

## Tasks

<task type="auto">
  <name>Navigation Components</name>
  <files>
    client/src/components/AppLayout.jsx
  </files>
  <action>
    - Ensure the bottom navigation bar has exactly four tabs (Home, Add, Groups, Reports). Use appropriate icons for them. Use `/dashboard` for Home, `/` for Add, `/settings` for Groups, `/report` for Reports.
    - Update the top sticky header on mobile to have the Wordmark/Icon on the left, and the Auth badge (using `useAuth`) on the right, replacing or alongside the mobile menu button.
  </action>
  <verify>grep "useAuth" client/src/components/AppLayout.jsx</verify>
  <done>Mobile header contains Auth badge and bottom nav has exactly 4 tabs.</done>
</task>

<task type="auto">
  <name>Floating Action Button</name>
  <files>
    client/src/components/AppLayout.jsx
  </files>
  <action>
    - Add a Floating Action Button (FAB) positioned at the bottom right corner of the mobile layout, above the bottom nav.
    - It should be a primary button containing a `Plus` icon, routing to the add expense flow (`/`).
  </action>
  <verify>grep "bottom-20" client/src/components/AppLayout.jsx || grep "bottom-24" client/src/components/AppLayout.jsx</verify>
  <done>FAB is implemented and visible on mobile.</done>
</task>

## Success Criteria
- [ ] Top header has Auth badge.
- [ ] Bottom nav has 4 specific tabs.
- [ ] FAB is visible.
