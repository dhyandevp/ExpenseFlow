# Contributing to ExpenseFlow

Thank you for contributing to ExpenseFlow. This guide details local setup, development conventions, testing standards, and pull request workflows.

---

## 1. Prerequisites

Before starting, ensure the following tools are installed:

- **Node.js**: `v20.0.0` or higher
- **npm**: `v10.0.0` or higher
- **Git**: `v2.40.0` or higher
- **Firebase CLI** *(optional, for local Firestore rules testing)*: `npm install -g firebase-tools`
- **Wrangler** *(included via devDependencies)*: Cloudflare Workers developer CLI

---

## 2. Local Setup

### Step 1: Clone Repository
```bash
git clone https://github.com/dhyandevp/ExpenseFlow.git
cd ExpenseFlow
```

### Step 2: Install Dependencies
Install root and workspace client dependencies:
```bash
npm run install:all
```
*(Runs `npm install` at root and `npm --prefix client install`)*.

### Step 3: Configure Environment Variables
Copy `.env.example` as a template for client and worker environments:

1. **Client environment (`client/.env.development.local`):**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:...
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=expenseflow_receipts
```

2. **Cloudflare Worker local secrets (`.dev.vars` at repository root):**
```env
ENVIRONMENT=development
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
FIREBASE_SERVICE_ACCOUNT_B64=<base64-encoded-service-account-json>
```

### Step 4: Run Development Server
```bash
npm run dev
```
This starts both processes via `scripts/dev.js`:
- **Cloudflare Worker API**: `http://localhost:8787`
- **Vite Client**: `http://localhost:5173` (with `/api` proxying to `http://localhost:8787`)

### Step 5: Subdomain Testing Locally
ExpenseFlow routes marketing and product surfaces differently based on hostname:
- **Marketing Landing**: `http://localhost:5173`
- **Product Dashboard / App**: `http://app.localhost:5173` (supported out-of-the-box by modern browsers and Vite host configuration)

---

## 3. Branching & Commit Conventions

### Branch Naming
Create branches from `main` using structured prefixes:
- `feat/<short-description>`: New capabilities or features
- `fix/<short-description>`: Bug fixes
- `refactor/<short-description>`: Code restructuring without functional change
- `docs/<short-description>`: Documentation and template updates
- `test/<short-description>`: Adding or fixing test suites
- `chore/<short-description>`: Dependency updates, build configs

### Commit Message Standards
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```text
<type>(<scope>): <imperative summary>

[optional body explaining motivation and context]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Refactoring production code
- `docs`: Documentation changes
- `test`: Adding or modifying tests
- `chore`: Tooling, configs, dependency bumps
- `perf`: Performance improvements

**Scopes:**
`api`, `auth`, `client`, `dashboard`, `expenses`, `fairness`, `rules`, `worker`, `deps`

**Examples:**
```text
feat(auth): add guest join session restoration on refresh
fix(worker): redirect marketing hostname requests for product routes to app domain
docs(contributing): add local setup and testing guide
```

---

## 4. Coding Standards

### Immutability & State Management
- Never mutate existing objects, arrays, or React state in place.
- Use object and array spread (`{ ...item, prop: value }`) or functional state updates.
- Keep business math in pure functions (`shared/balanceMath.js`, `shared/fairness.js`).

### File Organization & Sizing
- Small, single-purpose files preferred over large monolithic scripts.
- Maximum soft maintainability ceiling: ~400–800 lines per file.
- Domain-driven structure:
  - `client/src/pages/`: Route-level views
  - `client/src/components/`: Reusable UI elements
  - `client/src/hooks/`: Reusable React logic
  - `api/`: Cloudflare Worker endpoint handlers
  - `shared/`: Pure math and calculation algorithms
  - `tests/`: Automated unit, integration, and security rule suites

### Styling & Theme
- Use Tailwind CSS with the **Aurora Forest** color palette (`Mayan Jade`, `Neo Solar`, `Timeless Grey`, `Mint of Spring`, `Silver Cloud`).
- Responsive layouts mobile-first; verify layouts across viewports.

### Security Hygiene
- **Never commit secrets**: Verify `.env*` and `.dev.vars` are never staged.
- **Validate input**: Validate API payloads and client form fields before processing.
- **Security Rules**: When modifying Firestore collections or fields, update `firestore.rules` accordingly.

---

## 5. Testing & Verification

Every pull request must pass the automated verification suite before merging.

### Run Unit Tests
```bash
npm run test:unit
```
Verifies pure balance calculation math and fairness score algorithms (`client/src/utils/__tests__/`).

### Run Worker & Integration Tests
```bash
npx vitest run tests/host.test.js tests/safeRedirect.test.js tests/clerk-webhook.test.js
```
Verifies edge routing, safe redirect sanitization, and webhook verification.

### Run Firestore Security Rule Tests
Requires Java and Firebase Emulators:
```bash
npm run test:rules
```
Executes security tests in `tests/firestore.rules.test.js` inside the Firestore Emulator.

### Verify Client Production Build
```bash
npm run build
```
Ensures Vite asset compilation succeeds without syntax, module resolution, or bundling errors.

---

## 6. Pull Request Process

1. **Check Base Branch**: All PRs target `main`.
2. **Sync with Main**: Rebase or merge latest `origin/main` before opening PR.
3. **Fill PR Template**: Complete all sections in `.github/PULL_REQUEST_TEMPLATE.md`:
   - Summary of changes
   - Change type checkboxes
   - Security checklist
   - Test execution logs
   - UI screenshots (mandatory for visual changes)
4. **Code Review**: Address all reviewer comments promptly. Never bypass CI status checks.
