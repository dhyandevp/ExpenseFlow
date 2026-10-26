## Summary
<!-- Concise overview of purpose and motivation behind PR -->

## Changes
<!-- Bulleted list of specific changes made -->
- 

### Change Type
- [ ] Bug fix (non-breaking change fixing defect)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature altering existing behavior)
- [ ] Refactoring / Performance (code cleanup or optimization without feature change)
- [ ] Documentation / Metadata (README, guides, templates, configs)
- [ ] CI / Tooling (build scripts, workflows, tests)

## Security Checklist
- [ ] No hardcoded secrets, API keys, or private tokens committed (`.env.local`, `.dev.vars` excluded)
- [ ] Input validation applied at boundaries (API endpoints, user forms, URL params)
- [ ] Firestore security rules updated and verified if database access changed
- [ ] Edge routing and host header checks preserved (`worker.js` subdomain isolation)
- [ ] CORS policies and security headers enforced (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`)
- [ ] Authentication state and JWT bridge integrity preserved (`/api/auth/jwt-bridge`, `/api/clerk-webhook`)

## Testing & Verification
<!-- Describe automated tests run and manual reproduction steps -->
### Automated Tests
```bash
npm run test:unit
```
- [ ] Unit tests pass (`npm run test:unit`)
- [ ] Worker and integration tests pass (`npx vitest run tests/host.test.js tests/safeRedirect.test.js tests/clerk-webhook.test.js`)
- [ ] Firestore rules tests pass (`npm run test:rules` - if applicable)
- [ ] Client production build passes (`npm run build`)

### Manual Verification
- [ ] Verified on local dev environment (`http://localhost:5173` / `http://localhost:8787`)
- [ ] Subdomain dispatch verified (`expenseflow.site` marketing vs `app.expenseflow.site` product)

## Screenshots / Visual Proof
<!-- Required for UI changes; provide screenshots or GIF recordings. Write N/A if non-UI change. -->
N/A
