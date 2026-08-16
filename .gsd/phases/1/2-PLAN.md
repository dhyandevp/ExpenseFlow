---
phase: 1
plan: 2
wave: 1
---

# Plan 1.2: State, Data & Styling Audit

## Objective
Deeply inspect the data layer (Firestore queries) and the presentation layer (CSS design tokens and utility classes) to ensure consistency and identify redundancy.

## Context
- `.gsd/ROADMAP.md`
- `client/src/index.css`
- `client/src/api/` (or wherever Firestore queries reside)

## Tasks

<task type="auto">
  <name>Document Firestore Queries</name>
  <files>
    - client/src/
  </files>
  <action>
    - Search the codebase for Firestore query calls (`getDocs`, `onSnapshot`, `addDoc`, etc.).
    - Document what data is being queried, where the queries live (e.g., API layer or inside components), and how state is managed (e.g., Context vs local state).
    - Add this to the Data Layer section of PRODUCT_SURFACE_AUDIT.md.
  </action>
  <verify>cat PRODUCT_SURFACE_AUDIT.md | grep "Firestore"</verify>
  <done>All major Firestore interactions and their locations are documented in the audit.</done>
</task>

<task type="auto">
  <name>Audit CSS Design Tokens</name>
  <files>
    - client/src/index.css
  </files>
  <action>
    - Inspect `index.css` for defined custom properties (colors, spacing, shadows).
    - Check for duplicated or inconsistent utility classes (e.g., multiple button classes).
    - Document findings and areas needing standardization in the Styling section of PRODUCT_SURFACE_AUDIT.md.
  </action>
  <verify>cat PRODUCT_SURFACE_AUDIT.md | grep "Styling"</verify>
  <done>Styling inconsistencies and design token definitions are documented.</done>
</task>

## Success Criteria
- [ ] Data Layer section added to `PRODUCT_SURFACE_AUDIT.md`.
- [ ] Styling section added to `PRODUCT_SURFACE_AUDIT.md`.
