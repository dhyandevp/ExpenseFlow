---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Route Classification & Missing Page Identification

## Objective
Create a route classification table to classify all pages based on required authentication level, and identify missing, unreachable, or broken routes based on actual code.

## Context
- `client/src/App.jsx`
- `PRODUCT_SURFACE_AUDIT.md`

## Tasks

<task type="auto">
  <name>Create Route Classification Table</name>
  <files>
    - ROUTE_MAP.md
  </files>
  <action>
    - Create a new file `ROUTE_MAP.md`.
    - Build a markdown table classifying all routes defined in App.jsx (e.g., Public, Global Auth, Group-Scoped).
    - Note the component rendered and the access conditions for each route.
  </action>
  <verify>cat ROUTE_MAP.md | grep "Route Classification"</verify>
  <done>Route Classification table is present in ROUTE_MAP.md.</done>
</task>

<task type="auto">
  <name>Identify Missing and Orphaned Routes</name>
  <files>
    - ROUTE_MAP.md
    - client/src/pages/
  </files>
  <action>
    - Identify if there are any orphaned page components that are not imported into `App.jsx`.
    - Identify if dedicated sign-up or sign-in pages are missing (if relying exclusively on Clerk components, note this).
    - Document any unreachable or broken navigation links discovered in the code.
    - Append findings to `ROUTE_MAP.md` under a "Routing Issues" section.
  </action>
  <verify>cat ROUTE_MAP.md | grep "Routing Issues"</verify>
  <done>Routing Issues section is present in ROUTE_MAP.md detailing any gaps or missing pages.</done>
</task>

## Success Criteria
- [ ] `ROUTE_MAP.md` contains a classification table for all routes.
- [ ] Any missing or orphaned routes are documented in `ROUTE_MAP.md`.
