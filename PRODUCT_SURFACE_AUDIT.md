# Product Surface Audit

## 1. Routes Map
*Source: `client/src/App.jsx`*

### Public Routes (No Auth Required)
- `/` - Landing Page
- `/terms` - Terms of Service
- `/privacy` - Privacy Policy
- `/contact` - Contact Us
- `/sso-callback` - Clerk Authentication Callback
- `/join/:code` - Join Group via link (Guest flow)

### Global Authenticated Routes (Requires `user`)
- `/profile-setup` - New user profile creation (Requires `!userProfile`)
- `/home` - Groups Dashboard (Group listing)
- `/account` - Profile management
- `/setup` - Group Creation

### Group-Scoped Authenticated Routes (Wrapped in `<AppLayout>`)
- `/group/:code` - Expense Logger (Primary flow)
- `/group/:code/dashboard` - Financial Dashboard
- `/group/:code/scenarios` - Scenario Planner
- `/group/:code/report` - Fairness Report
- `/group/:code/settings` - Group Settings

## 2. Page Components
*Source: `client/src/pages/`*
- `Landing.jsx` (305 lines): Public marketing and intro page.
- `GroupsHome.jsx` (235 lines): Authenticated home, shows user's groups.
- `GroupSetup.jsx` (474 lines): Wizard to create a new group.
- `JoinGroup.jsx` (131 lines): Guest access flow via group code.
- `Dashboard.jsx` (466 lines): Group financial metrics and charts.
- `ExpenseLogger.jsx` (406 lines): Adding and listing expenses.
- `ScenarioPlanner.jsx` (461 lines): Financial what-if simulations.
- `FairnessReport.jsx` (381 lines): Detailed settlement and fairness breakdown.
- `Settings.jsx` (405 lines): Group and member management.
- `Profile.jsx` (170 lines): Global user profile.
- `ProfileSetup.jsx` (142 lines): Initial profile setup after registration.
- `Contact.jsx`, `Privacy.jsx`, `Terms.jsx`, `NotFound.jsx`: Static/Legal pages.

## 3. Shared Components
*Source: `client/src/components/`*
- `AppLayout.jsx` (320 lines): Desktop sidebar and mobile bottom nav wrapper.
- `ExpenseForm.jsx` (317 lines): Core form for adding expenses.
- `AddCategoryModal.jsx` (234 lines): Modal for custom categories.
- `SettlementHistory.jsx` (214 lines): Displays past settlements.
- `ReceiptUpload.jsx` (168 lines): Cloudinary integration component.
- `AccountMenu.jsx` (115 lines): User drop-down menu.
- `Avatar.jsx`, `BalanceChip.jsx`, `Logo.jsx`, `SEO.jsx`, `ErrorBoundary.jsx`: UI primitives.
- `auth/SignInModal.jsx` (224 lines): Authenticated modal.
- `auth/GuestJoinModal.jsx` (135 lines): Guest modal.

## 4. Custom Hooks
*Source: `client/src/hooks/`*
- `useAuth.jsx` (6236 bytes): Massive central hook managing Clerk -> Firebase JWT bridge.
- `useDocumentTitle.js` (1482 bytes): SEO utility.
- `useReceiptUpload.js` (3111 bytes): Cloudinary logic.
*(Also `useGroup` and `useRecentGroups` defined directly in `App.jsx`)*

## 5. Data Layer (Firestore Queries)
*Source: `client/src/api/client.js`*

The application encapsulates all Firestore interactions within the `client.js` API module. No direct Firestore queries were found inside React components, indicating a clean separation of concerns.

### Collections & Queries
- **`users`**: Profiles are queried by `getDoc(doc(db, "users", userId))`.
- **`groups`**: Queried by `code` using `where("code", "==", code)`.
- **`groups/{id}/members`**: Subcollection for group members.
- **`groups/{id}/categories`**: Subcollection for group expense categories. Sorted by `sort_order` if available.
- **`groups/{id}/expenses`**: Subcollection for expenses. Sorted by `createdAt desc`. Supports filtering by date range, category, and member ID.
- **`groups/{id}/scenarios`**: Subcollection for saving hypothetical scenario parameters.
- **`groups/{id}/settlements`**: Subcollection for recorded debt settlements. Sorted by `date desc`.

### State Management
State relies on standard React state and contexts (`useAuth` and `GroupContext`). The API layer fetches data statelessly, and the UI triggers refetches rather than relying on real-time `onSnapshot` listeners.

## 6. Styling & Design Tokens
*Source: `client/src/index.css`*

### Tokens (CSS Variables)
- `background`: #EBFADB
- `foreground`: #293E33
- `surface`: #FFFFFF
- `primary`: #105D5E (Hover: #0D4A4B)
- `success`: #009A6E
- `highlight`: #B3EDA9
- `muted`: #C2CBC9 (Text: #767F7D)
- `accent`: #E8E300
- `border`: #C2CBC9
- `radius`: 0.75rem

### Common Utility Classes
- `.card`, `.card-hover`: Core container styles.
- `.btn-primary`, `.btn-secondary`, `.btn-ghost`: Standardized buttons with hover/active states.
- `.input-field`: Standardized form inputs.
- `.skeleton`: Loading placeholder.
- `.glass`, `.glass-nav`, `.glass-header`: Liquid glass effects with `backdrop-filter`.

*Observation: Design tokens are centralized correctly. We will audit components to ensure these are used consistently without hardcoded overrides.*

## 7. Dead Code & Junk Identification
*Completed in Phase 1.3*

### Deleted Debug Scripts & Files
- Dozens of `fix_*.mjs`, `test_*.mjs`, `qa-*.cjs` files at the root level were removed.
- Debug screenshots (`blank_screen.png`, `test_error.png`, etc.) removed.
- Unused test stubs in `api/` (`test1.js` through `test4.js`) removed.

### Dependency Check
- `depcheck` identified `dotenv` and `jsonwebtoken` as potentially unused in the frontend (likely used in backend serverless functions, so they should be retained in the root `package.json` for now).
- `npm run build` completed successfully in the `client` directory (7.9s) with no missing runtime dependencies or unresolved imports. No fatal console errors were found during compilation.



