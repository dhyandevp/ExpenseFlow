# Architecture

> Updated for Vercel migration — 2026-08-16

## Overview
ExpenseFlow is a web-based expense tracking and group settlement application. It uses a React (Vite) frontend with a Firebase Firestore database. Authentication is managed by Clerk, which syncs users to Firestore via Vercel serverless webhook functions. The application uses Tailwind CSS for styling and Framer Motion for animations. It also relies on Playwright and Vitest for testing. Receipts are uploaded to Cloudinary.

## System Diagram
```mermaid
graph TD
    Client[React Frontend Vite] --> |Auth| Clerk[Clerk Auth Services]
    Client --> |Data read/write| Firestore[(Firebase Firestore)]
    Client --> |Receipts| Cloudinary[Cloudinary]
    Clerk --> |Webhook events| Vercel[Vercel Functions]
    Vercel --> |User sync| Firestore
```

## Components

### Frontend UI Components
- **Purpose:** Provide user interfaces for expense logging, dashboard, landing, and settings.
- **Location:** `/client/src/components` and `/client/src/pages`
- **Dependencies:** React, TailwindCSS, Framer Motion, Recharts, Lucide React.

### Hooks & State Management
- **Purpose:** Reusable logic and state handling for auth, receipts, etc.
- **Location:** `/client/src/hooks`
- **Dependencies:** React Hooks, Custom logic.

### API / Client Layer
- **Purpose:** Abstract the communication between the UI and external services.
- **Location:** `/client/src/api`
- **Dependencies:** Firebase SDK.

### Serverless API Functions
- **Purpose:** Handle secure event synchronization (like user creation/updates from Clerk to Firebase) and JWT bridging for authentication.
- **Location:** `/api`
- **Endpoints:**
  - `POST /api/auth/jwt-bridge` — Clerk/Guest → Firebase custom token exchange
  - `POST /api/clerk-webhook` — Clerk user.created → Firestore user sync
  - `GET /api/health` — Deployment health check
- **Dependencies:** `svix` (webhook verification), `firebase-admin`, `@clerk/clerk-sdk-node`.

### Shared Utilities
- **Purpose:** Core business logic for balance calculations and fairness reports, strictly abstracted.
- **Location:** `/shared`
- **Dependencies:** None.

## Data Flow
1. User logs in/registers using Clerk components on the frontend.
2. Clerk sends a webhook securely to a Vercel function.
3. The Vercel function verifies the webhook signature via Svix and updates Firebase via the Admin SDK.
4. User interacts with the frontend (e.g., adding an expense, uploading a receipt to Cloudinary).
5. The frontend communicates with Firebase Firestore directly using the Firebase Client SDK. Security is enforced by `firestore.rules`.
6. Data changes in Firestore are updated in the React app in real-time.

## Integration Points
| External Service | Type | Purpose |
|------------------|------|---------|
| Clerk | Auth API | User authentication and identity management |
| Firebase Firestore | Database | Primary database for expenses and users |
| Vercel Functions | Serverless | Backend API for auth bridging and webhook handling |
| Cloudinary | Storage | Image hosting for uploaded expense receipts |

## Conventions
- **Naming:** CamelCase for utilities/hooks (`useAuth.jsx`), PascalCase for React components (`Dashboard.jsx`, `AppLayout.jsx`).
- **Structure:** Monorepo-like layout. Frontend in `/client`, serverless API in `/api`, shared logic in `/shared`, tests in `/tests`.
- **Testing:** Vitest for unit testing (`/tests/unit.test.js`), Playwright for E2E and visual tests, `@firebase/rules-unit-testing` for Firestore rules.

## Technical Debt
- Resolved: Permissive Firestore rules, committed secrets, and test mock branches were removed during the production-ready transformation.
- Addressed: Code duplication for categories, models, and logos has been extracted to shared utilities.
