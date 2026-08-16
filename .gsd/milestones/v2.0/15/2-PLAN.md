---
phase: 15
plan: 2
wave: 1
---

# Plan 15.2: Landing Page and Join Flow Updates

## Objective
Update the Landing page for clearer dual CTAs and modify the Join Flow to mandate both Code and PIN.

## Context
- .gsd/SPEC.md
- client/src/pages/Landing.jsx
- client/src/pages/JoinGroup.jsx

## Tasks

<task type="auto">
  <name>Update Landing Page CTAs</name>
  <files>
    client/src/pages/Landing.jsx
  </files>
  <action>
    - Review `Landing.jsx` to ensure it features explicit dual CTAs.
    - Currently, `GuestJoinModal` is triggered by "Join Group". Update the text to emphasize it requires both Code and PIN for clarity (e.g. "Join with Code & PIN").
    - Ensure Clerk sign in / sign up is distinctly separated as full account creation.
  </action>
  <verify>grep -A 2 -B 2 "GuestJoinModal" client/src/pages/Landing.jsx</verify>
  <done>Landing page clearly delineates between Clerk Sign In and Guest Join options.</done>
</task>

<task type="auto">
  <name>Mandatory PIN in Join Flow</name>
  <files>
    client/src/pages/JoinGroup.jsx
  </files>
  <action>
    - Refactor `JoinGroup.jsx` so it does not attempt to automatically fetch the group with only the `code` from the URL.
    - The initial state should always display the PIN input field immediately when a URL param `code` is present.
    - Users must manually submit the form with both the URL-provided `code` and their typed `pin` before any API call is made.
  </action>
  <verify>grep -C 5 "handlePinSubmit" client/src/pages/JoinGroup.jsx</verify>
  <done>Join flow requests both Code and PIN simultaneously before proceeding.</done>
</task>

## Success Criteria
- [ ] Landing page has clear dual CTAs.
- [ ] Join flow immediately prompts for PIN when code is provided via URL.
