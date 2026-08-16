# ExpenseFlow — Project Specification

**Project:** ExpenseFlow (expenseflow.site)  
**Stack:** React 18 + Vite + TailwindCSS (Aurora Forest) · Vercel Functions (serverless) · Firebase (Firestore) · Clerk · Cloudinary  
**Contact:** dhyandevp@proton.me · https://linktr.ee/DhyandevRTX  
**Date:** August 2026  
**Status:** v2.0 IN PROGRESS

---

## Overview

ExpenseFlow is a shared expense tracking and fairness scoring tool for groups, roommates, and couples. It allows users to log shared expenses, compute net balances using a greedy debt simplification algorithm, generate settlement suggestions, and produce a fairness score.

## Current State (v1.0 Complete)

- Fully serverless: Firebase Client SDK + Vercel Functions
- Clerk hybrid authentication (authenticated + guest access with PIN)
- Mobile-first UI with liquid glass aesthetic
- Cloudinary for receipt image storage
- Full SEO implementation with PWA manifest
- Clean git history with no exposed credentials
- Vitest unit tests for all financial math logic
- Legal pages (Terms, Privacy, Contact)

## v2.0 Target State

- Professional, production-ready UX — clean, calm, trustworthy
- Consistent design system across all pages
- Zero visual clutter, no emoji in professional context
- Complete auth lifecycle without blank screens
- Responsive at 390px → 1440px without layout issues
- WCAG 2.2 AA accessibility baseline
- Dead code removed, bundle optimized
- Playwright-verified production QA

## Source Documentation

All detailed requirements, prompts, legal pages, security checklists, and ADRs are in:
[EXPENSEFLOW_FULL_DOCS.md](file:///home/dhyandevp/Documents/project-file/ExpenseFlow/EXPENSEFLOW_FULL_DOCS.md)
