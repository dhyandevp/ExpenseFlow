---
phase: 19
plan: 2
wave: 2
---

# Plan 19.2: PDF Export Function

## Objective
Implement a secure PDF export endpoint that generates a fairness report PDF for a given group.

## Context
- .gsd/SPEC.md
- netlify/functions/

## Tasks

<task type="auto">
  <name>PDF Export Dependencies</name>
  <files>
    package.json
  </files>
  <action>
    - Run `bun add pdfkit` in the project root to install the PDF generation library for the Netlify function.
  </action>
  <verify>grep "pdfkit" package.json</verify>
  <done>pdfkit is installed.</done>
</task>

<task type="auto">
  <name>PDF Export Function</name>
  <files>
    netlify/functions/export-pdf.js
  </files>
  <action>
    - Create `netlify/functions/export-pdf.js`.
    - Accept `groupId` from query parameters.
    - Fetch the group details and expenses using `firebase-admin`.
    - Generate a simple PDF using `pdfkit` that summarizes the group (Name, total expenses, number of members).
    - Return the PDF as a Base64-encoded string in the Netlify function response, setting `isBase64Encoded: true`, `Content-Type: application/pdf`, and `Content-Disposition: attachment; filename="report-{groupId}.pdf"`.
  </action>
  <verify>grep "pdfkit" netlify/functions/export-pdf.js</verify>
  <done>export-pdf endpoint is implemented and generates PDF.</done>
</task>

## Success Criteria
- [ ] `pdfkit` is added to package.json.
- [ ] `export-pdf.js` endpoint correctly returns a Base64-encoded PDF.
