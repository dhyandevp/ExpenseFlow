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
