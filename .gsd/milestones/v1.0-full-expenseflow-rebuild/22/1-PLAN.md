---
phase: 22
plan: 1
wave: 1
---

# Plan 22.1: Legal Pages Components

## Objective
Create the static legal pages (Terms of Service, Privacy Policy, and Contact) required for the application. The Contact page must have specific creator details.

## Context
- .gsd/SPEC.md
- ExpenseFlow_AI_Agent_Implementation_Prompts.md (Phase 22)

## Tasks

<task type="auto">
  <name>Create Terms and Privacy Pages</name>
  <files>
    client/src/pages/Terms.jsx
    client/src/pages/Privacy.jsx
  </files>
  <action>
    - Create `client/src/pages/Terms.jsx` with a basic Terms of Service layout.
    - Create `client/src/pages/Privacy.jsx` with a basic Privacy Policy layout.
    - Both components should use standard container styling matching the app's aesthetic.
    - Include placeholder text for standard provisions (user data, analytics, service usage, liability).
  </action>
  <verify>ls client/src/pages/Terms.jsx client/src/pages/Privacy.jsx</verify>
  <done>Terms.jsx and Privacy.jsx components exist.</done>
</task>

<task type="auto">
  <name>Create Contact Page</name>
  <files>
    client/src/pages/Contact.jsx
  </files>
  <action>
    - Create `client/src/pages/Contact.jsx`.
    - Explicitly list the email: `dhyandevp@proton.me`.
    - Explicitly include a link to `https://linktr.ee/DhyandevRTX`.
    - Identify the creator as a "Development Specialist".
  </action>
  <verify>grep -c "dhyandevp@proton.me" client/src/pages/Contact.jsx | grep "1"</verify>
  <done>Contact.jsx includes specific required details.</done>
</task>

## Success Criteria
- [ ] `Terms.jsx`, `Privacy.jsx`, and `Contact.jsx` exist.
- [ ] Contact details match the specification perfectly.
