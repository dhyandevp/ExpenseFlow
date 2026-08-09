---
phase: 7
plan: 1
wave: 1
---

# Plan 7.1: SEO Infrastructure

## Objective
Set up the core SEO infrastructure by adding base meta tags to `index.html`, installing `react-helmet-async`, and creating a reusable `useSEO` hook. This ensures dynamic meta tag management across all routes.

## Context
- .gsd/ROADMAP.md
- client/index.html
- client/src/App.jsx

## Tasks

<task type="auto">
  <name>Install react-helmet-async</name>
  <files>client/package.json</files>
  <action>
    - Install `react-helmet-async` in the `client` directory.
  </action>
  <verify>grep "react-helmet-async" client/package.json</verify>
  <done>react-helmet-async is present in package.json dependencies.</done>
</task>

<task type="auto">
  <name>Base Meta Tags & Hook Setup</name>
  <files>
    client/index.html
    client/src/utils/seo.js
    client/src/App.jsx
  </files>
  <action>
    - Add base meta tags (charset, viewport, title, description, keywords, author, theme-color, Open Graph, Twitter Card, JSON-LD) to `client/index.html`.
    - Create `useSEO(config)` custom hook in `client/src/utils/seo.js` using `react-helmet-async`.
    - Wrap the application in `<HelmetProvider>` inside `client/src/App.jsx`.
  </action>
  <verify>cat client/src/App.jsx | grep HelmetProvider</verify>
  <done>Base meta tags are in index.html, useSEO hook is created, and App.jsx provides the Helmet context.</done>
</task>

## Success Criteria
- [ ] `react-helmet-async` is installed.
- [ ] `client/index.html` contains comprehensive baseline meta tags.
- [ ] `<HelmetProvider>` is wrapping the React app.
- [ ] `useSEO` hook is ready for use.
