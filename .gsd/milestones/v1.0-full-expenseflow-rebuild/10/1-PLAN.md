---
phase: 10
plan: 1
wave: 1
---

# Plan 10.1: Desktop AppLayout Scaffold

## Objective
Use Stitch MCP to generate a desktop-native collapsible sidebar (or rich top-navigation bar) and integrate it into `AppLayout.jsx`, replacing the mobile bottom-navigation on wider viewports. Enforce strict Aurora Forest color constraints.

## Context
- .gsd/ROADMAP.md
- client/src/components/AppLayout.jsx
- client/src/index.css

## Tasks

<task type="auto">
  <name>Generate Desktop Sidebar via Stitch MCP</name>
  <files>None</files>
  <action>
    - Use Stitch MCP's `generate_screen_from_text` (or similar) to generate HTML/CSS for a desktop sidebar.
    - Prompt the tool with: "A desktop collapsible sidebar for an expense tracker. Uses Aurora Forest color variables like var(--surface), var(--primary) for active states, var(--text-muted) for inactive links, and var(--border) for the right border. No mobile bottom navigation."
    - Save the generated layout structure as reference in a scratch file (optional).
  </action>
  <verify>echo "Stitch MCP generation complete"</verify>
  <done>Generated sidebar code is acquired.</done>
</task>

<task type="auto">
  <name>Implement Responsive AppLayout</name>
  <files>
    client/src/components/AppLayout.jsx
  </files>
  <action>
    - Update `AppLayout.jsx` to render the desktop sidebar on `md` and larger viewports.
    - Ensure the main content area adjusts correctly to the sidebar.
    - Strictly map all colors to existing CSS variables (e.g., `--surface`, `--primary`, `--border`). Do NOT use hallucinated hex codes.
  </action>
  <verify>grep "hidden md:flex" client/src/components/AppLayout.jsx</verify>
  <done>AppLayout displays a sidebar on desktop and hides the bottom nav.</done>
</task>

## Success Criteria
- [ ] Desktop sidebar exists on `md+` viewports.
- [ ] Strict Aurora Forest colors are used exclusively.
