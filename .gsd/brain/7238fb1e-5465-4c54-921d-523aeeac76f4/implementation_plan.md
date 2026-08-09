# Implementation Plan: Audit and Restructure of AI Agent Prompts

## Goal Description
The current `ExpenseFlow_AI_Agent_Implementation_Prompts.md` contains 5 massive, overloaded prompts that are unrealistic for an AI agent to execute successfully without context degradation. Additionally, it contains contradictions (e.g., forbidding client imports in Netlify functions while requiring shared math logic) and completely misses critical implementation details (e.g., Cloudinary receipt uploads). 

This plan details how the document will be rewritten to break the 5 massive prompts into 14 atomic, executable phases with explicit verification criteria for each, ensuring a realistic and robust roadmap.

## Proposed Changes

### [MODIFY] ExpenseFlow_AI_Agent_Implementation_Prompts.md
The document will be completely rewritten to replace the 5 generic prompts with 14 atomic phases.

#### Key Fixes & Additions:
1. **Contradiction Resolution:** The prompt demanding "no client imports" in Netlify functions contradicts the requirement for the client and the `balance-trigger` function to share the exact same financial math logic. 
   * **Fix:** Introduce a task to extract `balanceMath.js` and `fairness.js` into a new `shared/` directory at the project root, accessible by both `client/` and `netlify/functions/`.
2. **Missing Requirements Added:** 
   * **Cloudinary Receipt Uploads:** The entire implementation for XHR-based Cloudinary uploads, removing `firebase/storage`, file size/type validation, and `receiptUrl` updates was missing. Added as a dedicated phase.
   * **Desktop UI Redesign:** Added to align with the overarching ROADMAP.md milestone goals.
3. **Overload Reduction (Atomicity):** AI agents fail when context is overloaded. The massive Prompt 1 (Schema + Rules + Functions Init + 3 Complex Functions) is split into 4 distinct phases. Prompt 4 (Exports + Migrations + Testing) is split into 3 phases.
4. **Per-Phase Verification:** Removed the single "Final Verification" block at the bottom and instead appended specific, actionable `<verify>` criteria to the end of *every* phase so the agent verifies its work continuously.

#### The New 14-Phase Roadmap Structure:
- **Phase 1: Database Schema & Shared Architecture** (Subcollections, `shared/` directory setup)
- **Phase 2: Firestore Security Rules** (Strict rules, helper functions, emulator tests)
- **Phase 3: Netlify Functions Infrastructure & Auth Bridge** (jwt-bridge.js, rate limiting, Admin SDK init)
- **Phase 4: Netlify Functions Webhooks & Triggers** (balance-trigger.js, clerk-webhook.js)
- **Phase 5: Authentication State & Landing Routing** (useAuth.js, hybrid routing)
- **Phase 6: PIN Verification Component** (Framer motion shake, Aurora colors, accessibility, 3-strike lockout)
- **Phase 7: Cloudinary Receipt Uploads** (useReceiptUpload.js, XHR progress, validation, schema updates)
- **Phase 8: Mobile-First UI & Styling Enforcement** (Bottom nav, glass effects, color audits)
- **Phase 9: Data Export Functions** (export-csv.js, export-pdf.js, csvSafe)
- **Phase 10: Vitest Unit Testing** (Math coverage, calculateSplits integer validation)
- **Phase 11: Data Migration Script** (SQLite to Firestore batched writes, verification logging)
- **Phase 12: Legal Pages & Footer** (Terms, Privacy, Contact)
- **Phase 13: SEO, Meta Tags & 404 Routing** (useSEO.js, structured data, catch-all routing)
- **Phase 14: Git Security & Cleanup** (pre-commit hook, lockfile scrub, legacy brand scrub)

## Verification Plan
After updating the document, I will perform a consistency audit by reading the new `ExpenseFlow_AI_Agent_Implementation_Prompts.md` and verifying that all constraints, missing items, and verification blocks are present.
