---
phase: 9
plan: 3
wave: 2
---

# Plan 9.3: End-to-End Verification & Security Testing

## Objective
Final validation of the rebuilt ExpenseFlow app to ensure it works end-to-end and passes all security checks outlined in Part 4 of the documentation.

## Context
- /EXPENSEFLOW_FULL_DOCS.md (Part 4 Security Testing Checklist)
- /.gsd/ROADMAP.md (Phase 9 Task 5 & 6)

## Tasks

<task type="checkpoint:human-verify">
  <name>Final End-to-End Verification</name>
  <files>
    - N/A
  </files>
  <action>
    Ask the user to start the app locally and verify the following flows:
    - Auth flows (Clerk login and Guest PIN login)
    - Expense CRUD (Create, Read, Update, Delete)
    - Balance calculation updates live on the dashboard
    - Receipt upload to Cloudinary works and displays correctly
    - CSV/PDF exports generate properly
    - All pages render correctly on mobile and desktop views
  </action>
  <verify>echo "User manually verified core flows"</verify>
  <done>User confirmed core flows operate without issues</done>
</task>

<task type="checkpoint:human-verify">
  <name>Execute Security Testing Checklist</name>
  <files>
    - /EXPENSEFLOW_FULL_DOCS.md
  </files>
  <action>
    Ask the user to go through the Part 4 "Security Testing Checklist" from `EXPENSEFLOW_FULL_DOCS.md` line by line:
    - A. Authentication & Access Control (Test guest tokens, Clerk JWTs, API auth headers)
    - B. Firestore Security Rules Testing (Run emulator tests if not already done)
    - C. Input Validation (Verify max amounts, negative amounts, XSS prevention, CSV sanitization, upload size limits)
    - D. Rate Limiting (Verify JWT bridge and guest join limits)
    - E. Environment & Secrets (Confirm no leaked secrets, .env.example exists)
    - F. HTTPS & Headers (Verify headers on deployment)
  </action>
  <verify>echo "User manually executed and passed security checklist"</verify>
  <done>User confirmed all security checklist items pass</done>
</task>

## Success Criteria
- [ ] End-to-end functionality verified by the user.
- [ ] Security testing checklist completed successfully.
