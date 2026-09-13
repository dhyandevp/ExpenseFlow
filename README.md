# ExpenseFlow

Shared expense tracking and fairness scoring for groups, roommates, and couples.

ExpenseFlow allows users to log shared expenses, compute net balances using a greedy debt simplification algorithm, generate settlement suggestions, and produce a fairness score.

## Architecture

ExpenseFlow is built on Cloudflare:
- **Frontend**: React 18, Vite, TailwindCSS (Aurora Forest theme), Framer Motion
- **Authentication**: Clerk (Hybrid model supporting authenticated users and PIN-free guest access with Group Code)
- **Database**: Firebase Firestore
- **Backend / API**: Cloudflare Workers (Native Web APIs, RS256 token minting, Firestore REST API)
- **Storage**: Cloudinary (for receipt image uploads)

## Local Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v20+
- A Firebase project with Firestore enabled
- A Clerk application
- A Cloudinary account

### 2. Install Dependencies
```bash
npm run install:all
```

### 3. Environment Variables
Configure `.env.local` (for production) and `.env.development.local` (for local development) based on `.env.example`:
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
VITE_CLOUDINARY_UPLOAD_PRESET=expenseflow_receipts
```

For Cloudflare local worker secrets, use `.dev.vars`:
```env
ENVIRONMENT=development
CLERK_SECRET_KEY=sk_test_...
FIREBASE_SERVICE_ACCOUNT_B64=...
```

### 4. Start the Development Server
```bash
npm run dev
```
This runs both the Vite client (proxied to port 8787) and the Cloudflare Worker runtime.

## Deployment

ExpenseFlow is deployed on **Cloudflare Workers** (Workers + Static Assets):

1. Configure `wrangler.jsonc`.
2. Build the client application:
   ```bash
   npm run build
   ```
3. Deploy to Cloudflare:
   ```bash
   npm run deploy
   ```
4. Set server-side secrets in Cloudflare:
   ```bash
   npx wrangler secret put CLERK_SECRET_KEY
   npx wrangler secret put CLERK_WEBHOOK_SECRET
   npx wrangler secret put FIREBASE_SERVICE_ACCOUNT_B64
   ```
