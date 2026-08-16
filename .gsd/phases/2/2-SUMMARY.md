# Plan 2.2 Summary: Flow Mapping (Auth & Group Context)

## Actions Taken
- Mapped the primary user lifecycle from visitor through authentication, group access, and logout.
- Analyzed and documented the state flow for `currentGroup` via `GroupContext` and `localStorage`.
- Analyzed and documented the authentication state flow (Clerk -> JWT Bridge -> Firebase Custom Token -> Firestore Profile).
- Added these sections to `ROUTE_MAP.md`.

## Result
User lifecycle and state architecture (Auth & Group Context) fully mapped and documented in `ROUTE_MAP.md`.
