---
phase: 2
plan: 2
wave: 1
---

# Plan 2.2: Flow Mapping (Auth & Group Context)

## Objective
Map the primary user lifecycle flow and document how the authentication state and group context are managed across the application.

## Context
- `client/src/App.jsx`
- `client/src/hooks/useAuth.jsx`
- `client/src/components/AppLayout.jsx`

## Tasks

<task type="auto">
  <name>Map Primary User Lifecycle Flow</name>
  <files>
    - ROUTE_MAP.md
  </files>
  <action>
    - Document the flow from visitor -> sign in -> profile setup -> home -> group -> usage -> logout -> sign in again.
    - Create a flowchart or sequential step list in `ROUTE_MAP.md` under "User Lifecycle Flow".
  </action>
  <verify>cat ROUTE_MAP.md | grep "User Lifecycle Flow"</verify>
  <done>User Lifecycle Flow section is present in ROUTE_MAP.md.</done>
</task>

<task type="auto">
  <name>Document State Flows</name>
  <files>
    - ROUTE_MAP.md
  </files>
  <action>
    - Document how `currentGroup` gets set (from `GroupsHome`, local storage, `AppLayout` selection) and cleared.
    - Document the Auth State Flow (Clerk -> JWT bridge -> Firebase custom token -> Firestore) based on `useAuth.jsx`.
    - Append these documentation sections to `ROUTE_MAP.md` under "State Architecture".
  </action>
  <verify>cat ROUTE_MAP.md | grep "State Architecture"</verify>
  <done>State Architecture section is present in ROUTE_MAP.md documenting auth and group context flow.</done>
</task>

## Success Criteria
- [ ] Primary user lifecycle is mapped out.
- [ ] Group context and Auth state flow are documented in `ROUTE_MAP.md`.
