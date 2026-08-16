---
phase: 1
plan: 3
wave: 2
---

# Plan 1.3: Build Verification & Commit

## Objective
Verify the app builds and runs correctly with all "ExpenseFlow" branding, then commit the Phase 1 changes with a clean git history.

## Context
- .gsd/SPEC.md
- .gsd/ROADMAP.md
- client/package.json
- client/vite.config.js
- netlify.toml

## Tasks

<task type="auto">
  <name>Build verification</name>
  <files>client/</files>
  <action>
    1. Install client dependencies: `cd client && bun install`
    2. Run production build: `cd client && bun run build`
    3. Verify build succeeds with exit code 0
    4. Verify dist/ directory is created
    5. Check built index.html contains "ExpenseFlow" (not "BalanceBoard"):
       `grep -i "expenseflow" client/dist/index.html`
    6. Check no "balanceboard" leaked into built output:
       `grep -ri "balanceboard" client/dist/ | wc -l` — must be 0
    
    WHY build check: The rename touches import paths, config names, and meta tags. A successful build proves no references broke.
  </action>
  <verify>cd client && bun run build && grep -ri "balanceboard" dist/ | wc -l — build must succeed, grep must return 0</verify>
  <done>Client builds successfully; dist/ output contains only "ExpenseFlow" brand references</done>
</task>

<task type="auto">
  <name>Commit Phase 1 changes</name>
  <files>all modified files</files>
  <action>
    1. Stage all Phase 1 changes:
       ```bash
       git add -A
       git reset -- client/dist  # don't commit build artifacts
       ```
    2. Commit with conventional message:
       ```bash
       git commit -m "chore: git security hardening + brand rename BalanceBoard → ExpenseFlow

       - Harden .gitignore with explicit .env patterns
       - Add pre-commit hook blocking .env commits  
       - Create .env.example with placeholder values
       - Rename all BalanceBoard references to ExpenseFlow
       - Update package.json names, HTML meta tags, config files
       - Verify clean build with new branding"
       ```
    
    WHY single commit: Phase 1 is a single logical unit (security + rename). Splitting would leave an intermediate state where the app has mixed branding.
  </action>
  <verify>git log -1 --oneline — must show the Phase 1 commit message</verify>
  <done>All Phase 1 changes committed in a single clean commit</done>
</task>

## Success Criteria
- [ ] `bun run build` succeeds with exit code 0
- [ ] Built output contains "ExpenseFlow", zero "BalanceBoard" references
- [ ] All changes committed with a descriptive conventional commit message
- [ ] Working tree is clean after commit
