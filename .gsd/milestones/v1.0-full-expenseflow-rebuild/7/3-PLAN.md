---
phase: 7
plan: 3
wave: 2
---

# Plan 7.3: 404 Handling & Social Assets

## Objective
Finalize site presentation by generating the Open Graph social preview image, creating a styled 404 page, and configuring Netlify for proper 404 HTTP status code routing.

## Context
- .gsd/ROADMAP.md
- client/src/pages/NotFound.jsx
- netlify.toml

## Tasks

<task type="auto">
  <name>Generate og-image.png</name>
  <files>
    client/public/og-image.png
  </files>
  <action>
    - Use AI image generation tool to create an `og-image.png` (1200x630px) that reflects the Aurora Forest palette, ExpenseFlow wordmark, and tagline.
    - Place the generated image in `client/public/og-image.png`.
  </action>
  <verify>ls client/public/og-image.png</verify>
  <done>og-image.png exists in the public directory.</done>
</task>

<task type="auto">
  <name>Create 404 Page & Netlify Config</name>
  <files>
    client/src/pages/NotFound.jsx
    client/src/App.jsx
    netlify.toml
  </files>
  <action>
    - Create a `NotFound.jsx` component applying the Aurora Forest palette and 'Liquid Glass' design elements. Include "Go home" and "Join group" actions, and set `<title>` to "404 — Page Not Found" with a `noindex` meta tag.
    - Register it as a catch-all route `*` in `client/src/App.jsx`.
    - Configure `netlify.toml` at the project root to handle SPA routing, returning a 404 status for unmatched routes directed to `index.html`.
  </action>
  <verify>cat netlify.toml</verify>
  <done>NotFound component is wired up and netlify.toml defines correct fallback routing.</done>
</task>

## Success Criteria
- [ ] Social share image (`og-image.png`) is present.
- [ ] Beautiful 404 page is integrated into React Router.
- [ ] Netlify configuration correctly manages SPA 404 fallback.
