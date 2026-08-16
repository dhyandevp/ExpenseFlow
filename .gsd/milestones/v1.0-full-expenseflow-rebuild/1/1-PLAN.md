---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Git Security Hardening

## Objective
Secure the repository by ensuring no credentials leak through git history, adding preventive guards against future leaks, and creating a safe `.env.example` template. This must happen BEFORE the brand rename so we start from a clean, secure baseline.

## Context
- .gsd/SPEC.md
- .gsd/ROADMAP.md
- server/.env (contains live Clerk keys — NOT committed, confirmed clean)
- .gitignore

## Tasks

<task type="checkpoint:human-verify">
  <name>Rotate Clerk secret key in Clerk dashboard</name>
  <files>N/A — external action in Clerk dashboard</files>
  <action>
    1. Open https://dashboard.clerk.com → API Keys
    2. Rotate the CLERK_SECRET_KEY (the current sk_live_ key)
    3. Copy the new secret key
    4. Update server/.env with the new CLERK_SECRET_KEY value
    5. Verify the publishable key (pk_live_) does NOT need rotation (it's public by design)
    
    WHY: The current sk_live key is visible in the local .env file. While it was never committed to git, rotating is a security best practice before any history operations.
  </action>
  <verify>Confirm new key works by checking Clerk dashboard shows the old key as revoked</verify>
  <done>Clerk dashboard shows rotated key; server/.env contains the new sk_live_ value</done>
</task>

<task type="auto">
  <name>Harden .gitignore and perform git history cleanup</name>
  <files>.gitignore</files>
  <action>
    1. Verify `server/.env` is already in `.gitignore` (it is — `.env` pattern covers it)
    2. Add explicit entries to .gitignore for defense-in-depth:
       ```
       # Environment files (defense-in-depth)
       .env
       .env.*
       !.env.example
       server/.env
       ```
    3. Git history has only 8 commits and NO secrets were ever committed (verified).
       No `git-filter-repo` or `git init` needed — history is clean.
    4. Confirm with: `git log --all -p | grep -c "sk_live"` returns 0
    
    WHY NOT filter-repo: The ROADMAP suggests it as conditional on commit count and exposure. With only 8 commits and zero credential exposure in history, a fresh init or filter-repo would destroy useful history for no security gain.
  </action>
  <verify>git log --all -p 2>/dev/null | grep -c "sk_live" || echo "0" — must return 0</verify>
  <done>.gitignore has explicit .env patterns; git history confirmed clean of secrets</done>
</task>

<task type="auto">
  <name>Add pre-commit hook and .env.example</name>
  <files>.git/hooks/pre-commit, .env.example</files>
  <action>
    1. Create `.git/hooks/pre-commit` script:
       ```bash
       #!/bin/sh
       # Block .env files from being committed
       if git diff --cached --name-only | grep -qE '\.env($|\.)'; then
         echo "ERROR: Attempting to commit .env file. Blocked by pre-commit hook."
         echo "If this is .env.example, use: git add -f .env.example"
         exit 1
       fi
       ```
    2. Make it executable: `chmod +x .git/hooks/pre-commit`
    3. Create `.env.example` at project root:
       ```
       # Clerk Authentication
       NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE
       CLERK_SECRET_KEY=sk_live_YOUR_KEY_HERE
       ```
    4. Force-add and commit: `git add -f .env.example`
    
    WHY pre-commit vs husky: With only 1 developer, a simple shell hook is lighter than adding husky + lint-staged dependencies. Can upgrade later if needed.
  </action>
  <verify>echo "test" > .env.test && git add .env.test 2>&1 && git diff --cached --name-only | grep ".env.test" && git reset .env.test && rm .env.test — the pre-commit hook should block on actual commit attempt</verify>
  <done>Pre-commit hook exists and is executable; .env.example committed with placeholder values</done>
</task>

## Success Criteria
- [ ] Clerk secret key rotated (user-verified)
- [ ] .gitignore has explicit .env protection patterns
- [ ] Git history confirmed clean of secrets (0 matches)
- [ ] Pre-commit hook blocks .env commits
- [ ] .env.example exists with placeholder keys
