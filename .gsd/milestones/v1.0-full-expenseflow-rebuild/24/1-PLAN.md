---
phase: 24
plan: 1
wave: 1
---

# Plan 24.1: Git Hooks

## Objective
Implement a git pre-commit hook to prevent `.env` files from being accidentally committed, securing sensitive credentials.

## Context
- .gsd/SPEC.md
- .git/hooks/

## Tasks

<task type="auto">
  <name>Create Pre-commit Hook</name>
  <files>
    .git/hooks/pre-commit
  </files>
  <action>
    - Create `.git/hooks/pre-commit` as a bash script.
    - Write logic to check staged files (`git diff --cached --name-only`).
    - If any staged file ends in `.env` (or contains `.env` and is not `.env.example`), output an error message and exit with status 1.
    - Ensure the script is executable (`chmod +x`).
  </action>
  <verify>test -x .git/hooks/pre-commit</verify>
  <done>Executable pre-commit hook exists that blocks .env files.</done>
</task>

## Success Criteria
- [ ] `.git/hooks/pre-commit` is created and executable.
- [ ] The hook blocks `.env` files.
