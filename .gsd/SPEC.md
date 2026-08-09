# ExpenseFlow — Project Specification

**Project:** ExpenseFlow (expenseflow.site)  
**Stack:** React 18 + Vite + TailwindCSS (Aurora Forest) · Netlify Functions (serverless) · Firebase (Firestore) · Clerk · Cloudinary  
**Contact:** dhyandevp@proton.me · https://linktr.ee/DhyandevRTX  
**Date:** August 2026

---

## Overview

ExpenseFlow is a shared expense tracking and fairness scoring tool for groups, roommates, and couples. It allows users to log shared expenses, compute net balances using a greedy debt simplification algorithm, generate settlement suggestions, and produce a fairness score.

## Current State

- Express 4 server on Render (free tier — 50s cold starts)
- better-sqlite3 with WAL mode
- 11 Express route files
- React 18 + Vite + TailwindCSS client
- Previously named "BalanceBoard" — rebrand to "ExpenseFlow" required

## Target State

- Fully serverless: Firebase Client SDK + Netlify Functions
- Clerk hybrid authentication (authenticated + guest access)
- Mobile-first UI with liquid glass aesthetic
- Cloudinary for receipt image storage
- Full SEO implementation with PWA manifest
- Clean git history with no exposed credentials
- Vitest unit tests for all financial math logic

## Source Documentation

All detailed requirements, prompts, legal pages, security checklists, and ADRs are in:
[EXPENSEFLOW_FULL_DOCS.md](file:///home/dhyandevp/Documents/project-file/ExpenseFlow/EXPENSEFLOW_FULL_DOCS.md)
