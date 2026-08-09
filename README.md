# ExpenseFlow

Shared expense tracking and fairness scoring for groups, roommates, and couples.

ExpenseFlow allows users to log shared expenses, compute net balances using a greedy debt simplification algorithm, generate settlement suggestions, and produce a fairness score.

## Architecture

ExpenseFlow is a fully serverless application built with a modern stack:
- **Frontend**: React 18, Vite, TailwindCSS (Aurora Forest theme), Framer Motion
- **Authentication**: Clerk (Hybrid model supporting authenticated users and guest access via PIN)
- **Database**: Firebase Firestore
- **Backend / API**: Netlify Functions (Serverless endpoints)
- **Storage**: Cloudinary (for receipt image uploads)

## Local Setup

### 1. Prerequisites
- [Bun](https://bun.sh/) (or npm/yarn/pnpm)
- A Firebase project with Firestore enabled
- A Clerk application
- A Cloudinary account

### 2. Install Dependencies
```bash
bun install:all
# This installs dependencies in the client
```

### 3. Environment Variables
Create a `.env` file in the root and configure it based on `.env.example`:
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
VITE_CLOUDINARY_UPLOAD_PRESET=expenseflow_receipts
```

### 4. Start the Development Server
```bash
bun run dev
```
This will start the Vite dev server for the client. 

## Deployment

ExpenseFlow is designed to be deployed on **Netlify**.

1. Connect your repository to Netlify.
2. Ensure the build command is `npm run build` or `bun run build`.
3. Set the publish directory to `client/dist`.
4. Ensure all environment variables (including `FIREBASE_SERVICE_ACCOUNT_B64` for Netlify Functions) are configured in the Netlify Dashboard.
