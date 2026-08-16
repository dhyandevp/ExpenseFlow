# ExpenseFlow

Shared expense tracking and fairness scoring for groups, roommates, and couples.

ExpenseFlow allows users to log shared expenses, compute net balances using a greedy debt simplification algorithm, generate settlement suggestions, and produce a fairness score.

## Architecture

ExpenseFlow is a fully serverless application built with a modern stack:
- **Frontend**: React 18, Vite, TailwindCSS (Aurora Forest theme), Framer Motion
- **Authentication**: Clerk (Hybrid model supporting authenticated users and guest access via PIN)
- **Database**: Firebase Firestore
- **Backend / API**: Vercel Functions (Serverless endpoints)
- **Storage**: Cloudinary (for receipt image uploads)

## Local Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v20+ (or [Bun](https://bun.sh/))
- A Firebase project with Firestore enabled
- A Clerk application
- A Cloudinary account

### 2. Install Dependencies
```bash
npm run install:all
# This installs dependencies in the client
```

### 3. Environment Variables
Create a `.env.local` file in the root and configure it based on `.env.example`:
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
VITE_CLOUDINARY_UPLOAD_PRESET=expenseflow_receipts
```

### 4. Start the Development Server
```bash
npm run dev
```
This will start the Vite dev server for the client.

For full-stack local development (including API functions), install the [Vercel CLI](https://vercel.com/docs/cli) and run:
```bash
npx vercel dev
```

## Deployment

ExpenseFlow is deployed on **Vercel**.

1. Connect your repository to Vercel.
2. The build command is `cd client && npm install && npm run build`.
3. The output directory is `client/dist`.
4. Configure all environment variables in the Vercel Dashboard:
   - **Browser-exposed (Build)**: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_FIREBASE_*`, `VITE_CLOUDINARY_*`
   - **Server-only (Functions)**: `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `FIREBASE_SERVICE_ACCOUNT_B64`
5. Vercel Functions are auto-detected from the `/api` directory.
