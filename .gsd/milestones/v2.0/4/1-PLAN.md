---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: GroupsHome Refinement

## Objective
Refine `GroupsHome.jsx` to be a clean, professional authenticated home screen. Fetch extended group data (members count, currency) for recent groups, clean up group cards, remove background blobs, and ensure zero-group and loading states are clear and professional.

## Context
- `client/src/pages/GroupsHome.jsx`
- `client/src/api/client.js`

## Tasks

<task type="auto">
  <name>Remove Decorative Blobs and Refine Greeting</name>
  <files>
    - client/src/pages/GroupsHome.jsx
  </files>
  <action>
    - Open `GroupsHome.jsx`.
    - Delete the `<div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">` containing the background blobs.
    - Keep the greeting section as it correctly shows the time of day and user name.
  </action>
  <verify>cat client/src/pages/GroupsHome.jsx | grep -q "blur-\[100px\]" || echo "Blobs removed"</verify>
  <done>Background blobs are no longer present in the DOM structure of GroupsHome.</done>
</task>

<task type="auto">
  <name>Fetch Extended Group Data</name>
  <files>
    - client/src/pages/GroupsHome.jsx
  </files>
  <action>
    - Import `getGroupById` from `../api/client`.
    - Add a `populatedGroups` state and `isFetchingGroups` state.
    - Write a `useEffect` that listens to `recentGroups`. If `recentGroups` exists, iterate and call `getGroupById` for each to fetch full details (so we have `members.length` and `currency`).
    - Handle Promise.all gracefully (catching errors for deleted groups and removing them from state).
  </action>
  <verify>cat client/src/pages/GroupsHome.jsx | grep "getGroupById"</verify>
  <done>GroupsHome fetches expanded details for recent groups on mount.</done>
</task>

<task type="auto">
  <name>Clean Group Cards UI</name>
  <files>
    - client/src/pages/GroupsHome.jsx
  </files>
  <action>
    - Update the `recentGroups.map` block to use `populatedGroups` instead.
    - Remove the visible `#CODE` element from the card entirely (or make it a tiny tooltip if needed, but per prompt: "Remove or de-emphasize group codes"). Let's remove it.
    - Add display for `group.members.length` (e.g., "4 members") and `group.currency` (e.g., "USD").
    - Ensure the "Open group" CTA is clearly visible on hover.
    - Check the empty state logic to ensure it prompts "Create / Join" clearly.
  </action>
  <verify>cat client/src/pages/GroupsHome.jsx | grep "members.length"</verify>
  <done>Group cards display member count and currency, and hide the raw group code.</done>
</task>

## Success Criteria
- [ ] Group cards show name (visual priority), member count, currency, and "Open group".
- [ ] Group codes are removed or heavily de-emphasized.
- [ ] Background blobs are removed for a cleaner look.
- [ ] Loading and empty states render gracefully.
