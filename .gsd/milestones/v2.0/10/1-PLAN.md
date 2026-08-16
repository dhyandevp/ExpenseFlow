---
phase: 10
plan: 1
wave: 1
---

# Plan 10.1: Settings Cleanup

## Objective
Reorganize the Group Settings page into clear, logically grouped sections (Group → Members → Categories → Access & Security → Preferences → Danger Zone) and visually distinguish destructive actions.

## Context
- `client/src/pages/Settings.jsx`
- `.gsd/ROADMAP.md`

## Tasks

<task type="auto">
  <name>Reorganize Settings UI</name>
  <files>
    - client/src/pages/Settings.jsx
  </files>
  <action>
    - Extract Currency and Settlement Threshold out of "Group Settings" into a new "Preferences" card.
    - Reorder cards strictly to: Group Info -> Members -> Categories -> Access & Security -> Preferences -> Danger Zone.
    - Enhance Danger Zone UI with a red tint (e.g. `bg-red-50` or similar accent classes) to heavily distinguish it from regular settings.
  </action>
  <verify>cat client/src/pages/Settings.jsx | grep -q "Preferences" && echo "Pass" || echo "Fail"</verify>
  <done>Settings page matches the requested layout hierarchy and Danger Zone is clearly marked.</done>
</task>

## Success Criteria
- [ ] Settings follow the explicit order specified in ROADMAP.
- [ ] Preferences is a distinct section.
- [ ] Danger zone has a pronounced visual warning.
