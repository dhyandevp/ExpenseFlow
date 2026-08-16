---
phase: 5
plan: 1
wave: 1
---

# Plan 5.1: Global Navigation Standardization

## Objective
Standardize the desktop sidebar and mobile bottom nav so they have consistent navigation links. Fix the incorrect mobile nav labels, ensure the AccountMenu and group switchers work properly, and clean up duplicate navigation from the mobile hamburger menu.

## Context
- `client/src/components/AppLayout.jsx`

## Tasks

<task type="auto">
  <name>Standardize Navigation Arrays</name>
  <files>
    - client/src/components/AppLayout.jsx
  </files>
  <action>
    - Delete the `mobileNavItems` array.
    - Update the Mobile Bottom Nav to map over `navItems` instead of `mobileNavItems`, ensuring both desktop and mobile have the exact same 5 core navigation options (Expenses, Dashboard, Scenarios, Report, Settings).
  </action>
  <verify>cat client/src/components/AppLayout.jsx | grep -q "mobileNavItems" && echo "Fail" || echo "Pass"</verify>
  <done>Mobile bottom nav uses the exact same routing array as desktop sidebar.</done>
</task>

<task type="auto">
  <name>Clean Up Mobile Hamburger Menu</name>
  <files>
    - client/src/components/AppLayout.jsx
  </files>
  <action>
    - Remove the mapping of `navItems` from the mobile hamburger menu to prevent duplicate navigation (since they are all now in the bottom nav).
    - Keep only the "Recent Groups" switcher and "Global Home" link in the hamburger menu.
  </action>
  <verify>cat client/src/components/AppLayout.jsx | grep -A 10 "Mobile Menu Overlay" | grep -q "navItems.map" && echo "Fail" || echo "Pass"</verify>
  <done>Hamburger menu no longer duplicates bottom nav links.</done>
</task>

<task type="auto">
  <name>Clean Up Decorative Background</name>
  <files>
    - client/src/components/AppLayout.jsx
  </files>
  <action>
    - Remove the `Background Blobs` div (containing `blur-[100px]`) from the `AppLayout` to match the clean aesthetic established in Phase 4.
  </action>
  <verify>cat client/src/components/AppLayout.jsx | grep -q "blur-\[100px\]" && echo "Fail" || echo "Pass"</verify>
  <done>Background blobs removed from global layout.</done>
</task>

## Success Criteria
- [ ] Navigation is consistent between desktop and mobile.
- [ ] "Groups" label pointing to `/settings` is fixed (it's now properly labeled "Settings" using `navItems`).
- [ ] Hamburger menu does not duplicate bottom nav items.
- [ ] Mobile FAB still appears when not on the root `/group/:code` path.
