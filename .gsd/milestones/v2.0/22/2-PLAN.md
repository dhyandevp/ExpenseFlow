---
phase: 22
plan: 2
wave: 2
---

# Plan 22.2: Routing and Footer Linking

## Objective
Make the newly created legal pages accessible via routing and add links to them in the Landing page footer.

## Context
- .gsd/SPEC.md
- client/src/App.jsx
- client/src/pages/Landing.jsx

## Tasks

<task type="auto">
  <name>Configure Routing</name>
  <files>
    client/src/App.jsx
  </files>
  <action>
    - Import `Terms`, `Privacy`, and `Contact` in `client/src/App.jsx`.
    - Add `<Route path="/terms" element={<Terms />} />`.
    - Add `<Route path="/privacy" element={<Privacy />} />`.
    - Add `<Route path="/contact" element={<Contact />} />`.
  </action>
  <verify>grep -c "/contact" client/src/App.jsx | grep "1"</verify>
  <done>Routes for terms, privacy, and contact exist.</done>
</task>

<task type="auto">
  <name>Update Landing Footer</name>
  <files>
    client/src/pages/Landing.jsx
  </files>
  <action>
    - Ensure the Landing page has a footer section. If not, add one at the bottom.
    - Add links to `/terms`, `/privacy`, and `/contact` using `Link` or `a` tags.
  </action>
  <verify>grep -c "/terms" client/src/pages/Landing.jsx | grep -q "[1-9]"</verify>
  <done>Landing footer contains links to the legal pages.</done>
</task>

## Success Criteria
- [ ] Routes are properly configured in `App.jsx`.
- [ ] Landing page has a footer with the legal links.
