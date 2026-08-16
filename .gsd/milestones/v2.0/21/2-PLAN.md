---
phase: 21
plan: 2
wave: 2
---

# Plan 21.2: Deployment Exclusions

## Objective
Add the `scripts/` directory to `.netlifyignore` to ensure the migration script and any future scripts are not deployed to production.

## Context
- .gsd/SPEC.md
- netlify.toml
- .netlifyignore (if exists)

## Tasks

<task type="auto">
  <name>Ignore scripts directory</name>
  <files>
    .netlifyignore
  </files>
  <action>
    - Create `.netlifyignore` in the project root if it doesn't exist.
    - Add `scripts/` to `.netlifyignore`.
    - Ensure `.netlifyignore` contains standard ignores like `node_modules/` or `.gsd/` if appropriate.
  </action>
  <verify>grep "scripts/" .netlifyignore</verify>
  <done>.netlifyignore contains scripts/ and exists.</done>
</task>

## Success Criteria
- [ ] `scripts/` is excluded from Netlify deployments.
