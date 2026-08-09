---
phase: 1
plan: 2
wave: 2
---

# Plan 1.2: Brand Rename — BalanceBoard → ExpenseFlow

## Objective
Replace every occurrence of "BalanceBoard" (and its casing variants) with the correct "ExpenseFlow" equivalent across the entire codebase. This covers code strings, HTML meta tags, config files, package names, and deployment configs.

## Context
- .gsd/SPEC.md
- .gsd/ROADMAP.md
- client/index.html
- client/src/App.jsx
- client/src/hooks/useDocumentTitle.js
- client/src/pages/Landing.jsx
- client/src/pages/FairnessReport.jsx
- client/package.json
- server/package.json
- server/db.js
- server/index.js
- server/routes/reports.js
- package.json (root)
- render.yaml
- netlify.toml
- README.md

## Tasks

<task type="auto">
  <name>Rename brand references in all source and config files</name>
  <files>
    client/index.html
    client/src/App.jsx
    client/src/hooks/useDocumentTitle.js
    client/src/pages/Landing.jsx
    client/src/pages/FairnessReport.jsx
    client/package.json
    server/package.json
    server/db.js
    server/index.js
    server/routes/reports.js
    package.json
    render.yaml
    netlify.toml
    README.md
  </files>
  <action>
    Apply these exact case-mapping replacements across ALL files:

    | Original | Replacement | Where |
    |----------|-------------|-------|
    | `BalanceBoard` | `ExpenseFlow` | Display names, titles, alt text, comments |
    | `balanceboard` | `expenseflow` | package.json "name" fields, URLs, localStorage keys, CSS classes |
    | `balanceboard-client` | `expenseflow-client` | client/package.json "name" |
    | `balanceboard-server` | `expenseflow-server` | server/package.json "name" |
    | `balanceboard-api` | `expenseflow-api` | render.yaml service name, domains |
    | `balanceboard.netlify.app` | `expenseflow.netlify.app` | render.yaml FRONTEND_URL |
    | `balanceboard-api.onrender.com` | `expenseflow-api.onrender.com` | render.yaml, netlify.toml |
    | `balanceboard.db` | `expenseflow.db` | server/db.js DB_PATH |
    | `balanceboard-report.csv` | `expenseflow-report.csv` | server/routes/reports.js |
    | `balanceboard_recent_groups` | `expenseflow_recent_groups` | client/src/App.jsx localStorage key |
    | `balanceboard_group` | `expenseflow_group` | client/src/App.jsx localStorage key |
    | `BalanceBoard logo` | `ExpenseFlow logo` | Landing.jsx aria-label |
    | `BalanceBoard Team` | `ExpenseFlow Team` | index.html JSON-LD |

    Specific file instructions:
    - **client/index.html**: Update `<title>`, `<meta>` description, og:title, og:site_name, twitter:title, application-name, JSON-LD name/author — use "ExpenseFlow" for display, "expenseflow" for URL-like contexts
    - **client/src/pages/Landing.jsx**: Replace all 6 occurrences: logo aria-label, brand text (×2), body copy (×2), footer tagline — change tagline to "ExpenseFlow — Fair sharing, clear minds."
    - **client/src/hooks/useDocumentTitle.js**: Replace description text and title suffix
    - **client/src/pages/FairnessReport.jsx**: PDF filename, share text
    - **client/src/App.jsx**: All 4 localStorage key references
    - **package.json** (root): "name" field → "expenseflow"
    - **server/db.js**: DB_PATH → "expenseflow.db"
    - **server/index.js**: API running message and startup banner
    - **render.yaml**: service name, FRONTEND_URL, domains — all to expenseflow variants
    - **netlify.toml**: API proxy target URL → expenseflow-api.onrender.com
    - **README.md**: Replace with "# ExpenseFlow" and brief description

    WHY NOT sed: These are targeted, context-aware replacements. Blind sed could corrupt binary-like content or miss case-sensitive contexts. Each file needs the RIGHT casing variant.
  </action>
  <verify>grep -ri "balanceboard" --include="*.js" --include="*.jsx" --include="*.html" --include="*.json" --include="*.toml" --include="*.yaml" --include="*.md" client/ server/ package.json render.yaml netlify.toml README.md 2>/dev/null | grep -v node_modules | grep -v ".lock" | grep -v ".gsd" | wc -l — must return 0</verify>
  <done>Zero "balanceboard" references remain in source, config, or content files (excluding .gsd docs, lock files, and EXPENSEFLOW_FULL_DOCS.md)</done>
</task>

<task type="auto">
  <name>Output change manifest</name>
  <files>.gsd/phases/1/CHANGES.md</files>
  <action>
    After all renames are complete, create `.gsd/phases/1/CHANGES.md` listing every file modified with the specific line(s) and old→new values. Format:

    ```markdown
    # Phase 1.2 — Brand Rename Change Manifest

    ## Files Modified
    | File | Lines Changed | Old Value | New Value |
    |------|--------------|-----------|-----------|
    | ... | ... | ... | ... |
    ```

    WHY: The ROADMAP explicitly requires "a complete list of every file modified with the specific line(s) changed" (Task 13).
  </action>
  <verify>test -f .gsd/phases/1/CHANGES.md && wc -l .gsd/phases/1/CHANGES.md — file must exist with content</verify>
  <done>CHANGES.md exists documenting every rename with file, line number, and old→new values</done>
</task>

## Success Criteria
- [ ] Zero `balanceboard` (case-insensitive) references in source/config files
- [ ] All package.json "name" fields use `expenseflow` variants
- [ ] HTML meta tags, OG tags, and JSON-LD all say "ExpenseFlow"
- [ ] localStorage keys use `expenseflow_` prefix
- [ ] render.yaml and netlify.toml reference `expenseflow` URLs
- [ ] CHANGES.md documents every modification
