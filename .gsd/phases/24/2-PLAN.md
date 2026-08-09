---
phase: 24
plan: 2
wave: 2
---

# Plan 24.2: Lockfile Scrub

## Objective
Remove old legacy lockfiles (`bun.lock`) and regenerate them with `npm install` to purge any residual references to the old project name "balanceboard".

## Context
- .gsd/SPEC.md
- bun.lock
- client/bun.lock

## Tasks

<task type="auto">
  <name>Delete and Regenerate Lockfiles</name>
  <files>
    bun.lock
    client/bun.lock
    package-lock.json
    client/package-lock.json
  </files>
  <action>
    - Delete `bun.lock` and `client/bun.lock` if they exist.
    - Delete `package-lock.json` and `client/package-lock.json` if they exist.
    - Run `npm install` in the root directory.
    - Run `npm install` in the `client/` directory.
  </action>
  <verify>grep -ri "balanceboard" bun.lock client/bun.lock 2>/dev/null || true</verify>
  <done>Lockfiles do not contain "balanceboard" and are updated.</done>
</task>

## Success Criteria
- [ ] `bun.lock` files are deleted.
- [ ] `package-lock.json` files are regenerated.
- [ ] No "balanceboard" strings remain in the repository.
