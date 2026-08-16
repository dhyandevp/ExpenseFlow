---
phase: 7
plan: 2
wave: 1
---

# Plan 7.2: SEO Implementation & Crawl Assets

## Objective
Apply the dynamic `useSEO` hook to key application pages and create static assets (`sitemap.xml`, `robots.txt`, `manifest.json`) for search engines and PWA capabilities.

## Context
- .gsd/ROADMAP.md
- client/src/utils/seo.js
- client/public/sitemap.xml
- client/public/robots.txt
- client/public/manifest.json

## Tasks

<task type="auto">
  <name>Apply useSEO to Pages</name>
  <files>
    client/src/pages/Landing.jsx
    client/src/pages/GroupSetup.jsx
    client/src/pages/Dashboard.jsx
  </files>
  <action>
    - Import and use the `useSEO` hook in key page components to set unique titles, descriptions, and canonical URLs.
  </action>
  <verify>grep "useSEO" client/src/pages/Landing.jsx</verify>
  <done>Page components dynamically set their meta tags.</done>
</task>

<task type="auto">
  <name>Create Static Crawl Assets</name>
  <files>
    client/public/sitemap.xml
    client/public/robots.txt
    client/public/manifest.json
  </files>
  <action>
    - Create `/public/sitemap.xml` detailing public routes.
    - Create `/public/robots.txt` allowing `/` but disallowing `/api/`, `/dashboard/`, and `/group/`.
    - Create `/public/manifest.json` setting up the PWA configuration with name, theme_color, and background_color matching Aurora Forest palette.
  </action>
  <verify>cat client/public/robots.txt</verify>
  <done>sitemap.xml, robots.txt, and manifest.json exist with proper configuration.</done>
</task>

## Success Criteria
- [ ] Pages dynamically update meta data via `useSEO`.
- [ ] `robots.txt` appropriately gates private routes.
- [ ] `manifest.json` defines PWA metadata.
