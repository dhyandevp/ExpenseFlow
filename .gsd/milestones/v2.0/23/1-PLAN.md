---
phase: 23
plan: 1
wave: 1
---

# Plan 23.1: SEO Implementation

## Objective
Implement SEO tagging using `react-helmet-async` across all page components to dynamically manage the document title, description, and indexing rules.

## Context
- .gsd/SPEC.md
- client/src/components/SEO.jsx
- client/src/pages/NotFound.jsx
- client/src/pages/*.jsx

## Tasks

<task type="auto">
  <name>Create SEO Component</name>
  <files>
    client/src/components/SEO.jsx
    client/src/utils/seo.js
  </files>
  <action>
    - Create `client/src/components/SEO.jsx` that exports an `SEO` component using `<Helmet>` from `react-helmet-async`.
    - It should accept `title`, `description`, and `noindex` props.
    - Create a dummy `client/src/utils/seo.js` that exports the `SEO` component to satisfy any existing imports.
  </action>
  <verify>ls client/src/components/SEO.jsx</verify>
  <done>SEO component uses Helmet to set tags.</done>
</task>

<task type="auto">
  <name>Implement SEO in Pages</name>
  <files>
    client/src/pages/Dashboard.jsx
    client/src/pages/ExpenseLogger.jsx
    client/src/pages/FairnessReport.jsx
    client/src/pages/GroupSetup.jsx
    client/src/pages/JoinGroup.jsx
    client/src/pages/Landing.jsx
    client/src/pages/ScenarioPlanner.jsx
    client/src/pages/Settings.jsx
    client/src/pages/Terms.jsx
    client/src/pages/Privacy.jsx
    client/src/pages/Contact.jsx
    client/src/pages/NotFound.jsx
  </files>
  <action>
    - Ensure every page imports `SEO` from `../components/SEO` (or `../../components/SEO`).
    - Render `<SEO title="..." description="..." />` at the top of the returned JSX fragment in each page component.
    - In `NotFound.jsx`, pass `noindex={true}` and remove the old imperative `useSEO` call.
  </action>
  <verify>grep -c "SEO" client/src/pages/NotFound.jsx | grep -q "[1-9]"</verify>
  <done>All pages render the SEO component.</done>
</task>

## Success Criteria
- [ ] `SEO.jsx` exists and uses `react-helmet-async`.
- [ ] All page components render `<SEO />`.
- [ ] `NotFound.jsx` includes `<SEO noindex={true} />`.
