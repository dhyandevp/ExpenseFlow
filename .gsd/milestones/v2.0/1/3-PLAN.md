---
phase: 1
plan: 3
wave: 2
---

# Plan 1.3: Junk Identification & Sanity Check

## Objective
Identify dead files, debug scripts, unused test stubs, unused dependencies, and console errors to prune the repository before major refactoring.

## Context
- `.gsd/ROADMAP.md`
- `package.json`

## Tasks

<task type="auto">
  <name>Identify Dead Code & Junk Files</name>
  <files>
    - /
    - api/
  </files>
  <action>
    - Locate all `fix_*.mjs`, `test_*.mjs`, `qa-*.cjs`, and similar debug scripts at the root.
    - Locate dead test files in `api/` (e.g., `test1.js` - `test4.js`).
    - Identify debug screenshots at the root.
    - List all these files in the Dead Code section of PRODUCT_SURFACE_AUDIT.md.
  </action>
  <verify>cat PRODUCT_SURFACE_AUDIT.md | grep "Dead Code"</verify>
  <done>A comprehensive list of files slated for deletion is documented.</done>
</task>

<task type="auto">
  <name>Dependency and Error Check</name>
  <files>
    - package.json
  </files>
  <action>
    - Use tools (e.g., `depcheck` if available, or manual inspection) to find unused npm dependencies.
    - Run a quick build or test command to surface any existing console errors or broken imports.
    - Finalize the `PRODUCT_SURFACE_AUDIT.md` document with these findings.
  </action>
  <verify>ls PRODUCT_SURFACE_AUDIT.md</verify>
  <done>Dependencies to remove are listed, and the final audit document is complete and ready for review.</done>
</task>

## Success Criteria
- [ ] All junk/dead files are identified and documented.
- [ ] Unused dependencies and existing errors are documented.
- [ ] `PRODUCT_SURFACE_AUDIT.md` is complete and comprehensive.
