---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Route, Component, & Hook Inventory

## Objective
Analyze and catalog the core building blocks of the application: routes, page components, shared components, and custom hooks. This forms the foundation for our product surface audit.

## Context
- `.gsd/SPEC.md`
- `.gsd/ROADMAP.md`
- `client/src/App.jsx`
- `client/src/components/AppLayout.jsx`

## Tasks

<task type="auto">
  <name>Map Application Routes</name>
  <files>
    - client/src/App.jsx
  </files>
  <action>
    - Inspect `App.jsx` to identify all defined routes.
    - Classify each route as public, global authenticated, or group-scoped.
    - Document the actual navigation flow and layout wrappers.
  </action>
  <verify>cat PRODUCT_SURFACE_AUDIT.md | grep "Routes"</verify>
  <done>Routes section in PRODUCT_SURFACE_AUDIT.md lists all active routes and their classification.</done>
</task>

<task type="auto">
  <name>Catalog Pages, Components, and Hooks</name>
  <files>
    - client/src/pages/
    - client/src/components/
    - client/src/hooks/
  </files>
  <action>
    - List every page component, noting its purpose and approximate size.
    - List every shared component and approximate its usage count.
    - List every custom hook (especially `useAuth`, `useGroup`, etc.) and note where they are used.
    - Append these findings to PRODUCT_SURFACE_AUDIT.md.
  </action>
  <verify>cat PRODUCT_SURFACE_AUDIT.md | grep "Components"</verify>
  <done>Components and Hooks sections in PRODUCT_SURFACE_AUDIT.md clearly list all discovered items.</done>
</task>

## Success Criteria
- [ ] `PRODUCT_SURFACE_AUDIT.md` is created and contains the route map.
- [ ] All pages, shared components, and hooks are inventoried in the audit document.
