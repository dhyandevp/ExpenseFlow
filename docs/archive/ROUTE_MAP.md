# Route Map & User Flow

## 1. Route Classification

| Route Path | Component | Auth Requirement | Layout Wrapper | Purpose |
|------------|-----------|------------------|----------------|---------|
| `/` | `Landing.jsx` | Public | None | Marketing home, initial entry point |
| `/terms` | `Terms.jsx` | Public | None | Static legal page |
| `/privacy` | `Privacy.jsx` | Public | None | Static legal page |
| `/contact` | `Contact.jsx` | Public | None | Static contact page |
| `/join/:code` | `JoinGroup.jsx` | Public / Guest | None | Invite link receiver (supports Guest PIN flow) |
| `/sso-callback` | `AuthenticateWithRedirectCallback` | Public | None | Clerk OAuth callback handler |
| `/profile-setup` | `ProfileSetup.jsx` | Global Auth | `ProtectedRoute` | Onboarding for first-time sign-ins |
| `/home` | `GroupsHome.jsx` | Global Auth | `ProtectedRoute` | Post-login dashboard (group selection) |
| `/account` | `Profile.jsx` | Global Auth | `ProtectedRoute` | Global user settings |
| `/setup` | `GroupSetup.jsx` | Global Auth | `ProtectedRoute` | Group creation wizard |
| `/group/:code` | `ExpenseLogger.jsx` | Group-Scoped Auth | `AppLayout` | Default view for a group; list & add expenses |
| `/group/:code/dashboard` | `Dashboard.jsx` | Group-Scoped Auth | `AppLayout` | Financial summary and metrics |
| `/group/:code/scenarios` | `ScenarioPlanner.jsx` | Group-Scoped Auth | `AppLayout` | Financial what-if simulations |
| `/group/:code/report` | `FairnessReport.jsx` | Group-Scoped Auth | `AppLayout` | Settlement breakdowns and PDF export |
| `/group/:code/settings` | `Settings.jsx` | Group-Scoped Auth | `AppLayout` | Group preferences and member management |
| `*` | `NotFound.jsx` | Public | None | Fallback 404 page |

## 2. Routing Issues & Missing Pages
- **Orphaned Components**: None identified. All files in `client/src/pages/` are correctly lazy-loaded and routed in `App.jsx`.
- **Missing Pages**: There are no dedicated `/sign-in` or `/sign-up` pages. The application uses a `<SignInModal>` overlay for authentication, which can sometimes be blocked by pop-up blockers or feel disjointed on mobile.
- **Unreachable Routes**: None found.

## 3. User Lifecycle Flow
1. **Visitor** lands on `/` (Landing).
2. **Sign In**: User clicks Sign In -> `<SignInModal>` (Clerk) handles authentication.
3. **SSO Callback**: OAuth redirects to `/sso-callback` -> completes auth.
4. **Auth State Resolution**: `useAuth` hook kicks in -> logs into Firebase via JWT bridge.
5. **Profile Check**: If user has no Firestore profile, redirected to `/profile-setup`.
6. **Home**: Once profile exists, user is routed to `/home` (`GroupsHome`).
7. **Group Access**: User clicks a group -> routed to `/group/:code` (`ExpenseLogger`).
8. **In-Group Navigation**: User navigates via `AppLayout` to `/dashboard`, `/scenarios`, `/report`, `/settings`.
9. **Log Out**: User clicks Log Out in `AccountMenu` -> `useAuth.signOut()` runs -> redirected to `/`.

## 4. State Architecture

### Group Context Flow (`currentGroup`)
- Managed by `GroupContext` in `App.jsx`.
- `currentGroup` is persisted in `localStorage` under `expenseflow_group`.
- **Set**: `setCurrentGroup` is called when a user selects a group from `GroupsHome` or switches groups in `AppLayout`. This also updates `recentGroups`.
- **Cleared**: Explicitly cleared on logout, or if the user goes back to `/home`.

### Auth State Flow
1. **Clerk Auth**: `@clerk/clerk-react` handles initial OAuth / Email magic links.
2. **JWT Bridge**: The `useAuth` hook listens to Clerk's session changes.
3. **Custom Token Fetch**: When Clerk session exists, it calls a Vercel Function (`/api/auth/token`) to exchange the Clerk JWT for a Firebase Custom Token.
4. **Firebase Auth**: `signInWithCustomToken(auth, customToken)` logs the user into Firebase Client SDK.
5. **Firestore Profile**: Finally, it fetches `getUserProfile` from Firestore to determine if the user needs to complete onboarding (`/profile-setup`).
