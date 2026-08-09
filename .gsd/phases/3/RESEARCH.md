# Phase 3 Research: Firestore Security Rules & Ponytail Simplifications

## Discovery Level 1.5

### Analysis of Roadmap Tasks
The roadmap outlines writing `firestore.rules` and testing them using the Firebase Emulator. It also includes some complex constraints:
- Task 6: Strict rules on `currentBalances`, `settlementSuggestions`, `fairnessScores` fields being writable only by service account.
- Task 10: Rate limiting group-by-code lookups via Firestore counter document with TTL.

### Ponytail Ultra Simplifications

**Ceiling / Simplification 1: Elimination of Service Account Rules**
- *Why:* In Phase 2, we applied Ponytail Ultra to eliminate the Netlify Functions background trigger. We no longer denormalize balances, settlements, or fairness scores into the database at all; they are calculated purely dynamically on the client. 
- *Action:* We will completely skip Task 6. There is no service account writing these fields, and these fields do not exist in the data model anymore. 

**Ceiling / Simplification 2: Elimination of Firestore Read Rate Limiting**
- *Why:* Task 10 asks to enforce rate limits (10 reads / 15 mins) on group-by-code lookups using a counter document. However, Firestore Security Rules cannot easily enforce rate limits on *reads* without a backend, because a malicious client can simply bypass writing to the rate limit counter and just attempt the read. True rate limiting requires a backend function or complex token bucket writes, which violates our serverless MVP philosophy.
- *Action:* Skip Task 10. We will rely on Firebase's built-in App Check (can be enabled later) and general quota limits to prevent abuse. 
- *Upgrade Path:* If scraping becomes a real issue, we can introduce Firebase App Check to ensure only the real app can query Firestore, or move the lookup to a rate-limited Cloud Function.

### Plan Structure
- **Plan 3.1:** Write the complete `firestore.rules` file covering authentication, groups, members, expenses, categories, and settlements.
- **Plan 3.2:** Write and run Firebase Emulator unit tests to verify the security rules mathematically.
