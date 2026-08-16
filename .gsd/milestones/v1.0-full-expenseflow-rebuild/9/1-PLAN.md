---
phase: 9
plan: 1
wave: 1
---

# Plan 9.1: Remove Legacy Server Infrastructure

## Objective
Remove all remnants of the old Express/SQLite server architecture. The application is now fully serverless via Netlify Functions and Firebase, so keeping the legacy backend code and configuration is unnecessary and could cause confusion.

## Context
- .gsd/SPEC.md
- .gsd/ROADMAP.md
- /server/ (directory to delete)

## Tasks

<task type="auto">
  <name>Delete legacy server directory and files</name>
  <files>
    - /server
    - /render.yaml
  </files>
  <action>
    - Recursively delete the entire `/server` directory and all its contents.
    - Delete `render.yaml` if it exists in the root directory.
  </action>
  <verify>test ! -d "server" && test ! -f "render.yaml"</verify>
  <done>The `/server` directory and `render.yaml` are completely removed from the project</done>
</task>

<task type="auto">
  <name>Clean up configuration references</name>
  <files>
    - /package.json
    - /.gitignore
  </files>
  <action>
    - Remove any scripts (like `start:server`, `dev:server`) or dependencies referencing Express, better-sqlite3, or the server directory from the root `package.json`.
    - Ensure `.gitignore` does not unnecessarily have `/server/.env` if you want to clean it up (optional, but good hygiene).
  </action>
  <verify>! grep -i -E "express|better-sqlite3|render" package.json</verify>
  <done>Root project configuration is purely focused on the client and serverless functions without legacy backend dependencies</done>
</task>

## Success Criteria
- [ ] `/server` directory no longer exists
- [ ] No Express or SQLite dependencies remain in the root `package.json`
