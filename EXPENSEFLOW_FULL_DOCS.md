# ExpenseFlow — Complete Documentation Package
**Project:** ExpenseFlow (expenseflow.site)  
**Stack:** React 18 + Vite + TailwindCSS (Aurora Forest) · Netlify Functions (serverless) · Firebase (Firestore + Storage) · Clerk  
**Contact:** dhyandevp@proton.me · https://linktr.ee/DhyandevRTX  
**Date:** August 2026

---

## PART 1 — ANTIGRAVITY PROMPTS

These are structured prompts for the Antigravity IDE. Each prompt is a self-contained instruction block. Feed them in the order listed for a coherent build sequence.

---

### PROMPT 1 — Project Rename & Brand Consolidation

```
You are working on a full-stack web app being renamed from "BalanceBoard" to "ExpenseFlow".

TASK: Rename all brand references across the entire codebase.

Rules:
- Replace every occurrence of "BalanceBoard", "balanceboard", "balance-board", "balance_board" with the appropriate case variant of "ExpenseFlow", "expenseflow", "expense-flow", "expense_flow"
- Update the HTML <title> tags, meta descriptions, og:title, og:description tags
- Update the README.md with the new project name
- Update package.json "name" field in both /server and /client
- Update render.yaml service name
- Update netlify.toml site name references
- Update the database filename from "balanceboard.db" to "expenseflow.db" in db.js
- Do NOT change any color values, tailwind tokens, or component logic
- Output a complete list of every file modified with the specific line(s) changed

The canonical brand name is: ExpenseFlow (capital E, capital F, no space)
The website is: https://expenseflow.site
```

---

### PROMPT 2 — Firebase Migration (SQLite → Firestore, Fully Serverless)

```
You are migrating the backend of ExpenseFlow from SQLite + Express on Render to Firebase Firestore with Netlify Functions. The goal is a fully serverless architecture with zero cold-start problems.

CURRENT STACK:
- Express 4 server on Render (free tier — 50s cold starts)
- better-sqlite3 with WAL mode
- 11 Express route files (balances.js, groups.js, expenses.js, etc.)

TARGET STACK:
- Netlify Functions (serverless, no persistent server)
- Firebase Client SDK v10+ talking directly to Firestore from the browser
- Firestore Security Rules enforcing all authorization at the database level
- No Firebase Admin SDK in the client tier (zero "god mode" access)
- One Netlify Function per complex server-side operation (balance aggregation, CSV export, PDF report, receipt compression trigger)

FIRESTORE COLLECTION STRUCTURE to implement:
```
groups/{groupId}
  - name: string
  - code: string (6-char, indexed)
  - pinHash: string (SHA-256)
  - currency: string
  - settlementThreshold: number
  - currentBalances: map { memberId: number }   ← denormalized, 1 read = full dashboard
  - createdAt: timestamp

  expenses/{expenseId}
    - paidBy: string (memberId)
    - amount: number
    - category: string
    - description: string
    - receiptPath: string
    - splits: map { memberId: shareAmount }
    - createdAt: timestamp

  members/{memberId}
    - name: string
    - color: string
    - emoji: string

  categories/{categoryId}
    - name: string
    - emoji: string
    - color: string
    - splitModel: string
    - sortOrder: number
    - isDefault: boolean

  settlements/{settlementId}
    - fromMember: string
    - toMember: string
    - amount: number
    - settledAt: timestamp

  fairnessSnapshots/{snapshotId}
    - scores: map { memberId: score }
    - takenAt: timestamp
```

NETLIFY FUNCTIONS to create (in /netlify/functions/):
1. balance-trigger.js — called after any expense write; recalculates currentBalances map and writes it back to the group document
2. export-csv.js — accepts groupId + date range, reads expenses, returns CSV file
3. export-pdf.js — generates PDF fairness report
4. clerk-webhook.js — handles user.created from Clerk, seeds Firestore user document
5. jwt-bridge.js — exchanges Clerk session token for Firebase custom token

FIRESTORE SECURITY RULES to write (firestore.rules):
- A user can read a group if: (a) they are authenticated via Clerk JWT AND their userId is in members collection, OR (b) they provide the correct 6-char code AND correct PIN hash
- A user can write expenses only if they are a verified group member
- The currentBalances field can only be written by a service account (via jwt-bridge function)
- Rate limit: enforce 10 reads per 15 minutes on group-by-code lookups (implement as a Firestore counter document with TTL)

MIGRATION STEPS:
1. Install firebase, firebase-admin (functions only) in client and netlify/functions
2. Create firebase.js config file in client/src/
3. Enable offline persistence with enableIndexedDbPersistence in firebase.js
4. Rewrite each API client call in client/src/api/client.js to use Firestore SDK directly
5. Move server-side math (greedy debt simplification, fairness score) to client/src/utils/ as pure functions
6. Delete /server directory after migration is verified
7. Update netlify.toml to point functions directory to /netlify/functions

Do not use the Firebase Admin SDK anywhere in the client. Only use it inside Netlify Functions where it is scoped to a single request and never exposes god-mode access to the browser.
```

---
Replace Firebase Storage with Cloudinary for all receipt image uploads in ExpenseFlow.

REASON FOR CHANGE:
Firebase Storage free tier = 5 GB total.
Cloudinary free tier = 25 GB + automatic WebP compression server-side.
This removes the need for the browser-image-compression library entirely.
Firestore still handles all text data (expenses, groups, members, balances).

CLOUDINARY SETUP:
1. Create a free account at https://cloudinary.com
2. In Cloudinary dashboard → Settings → Upload → Add upload preset:
   - Preset name: expenseflow_receipts
   - Signing mode: Unsigned (for direct browser uploads)
   - Folder: receipts/
   - Allowed formats: jpg, png, webp
   - Max file size: 5 MB
   - Incoming transformations:
       format: webp
       quality: auto (Cloudinary picks optimal quality automatically)
       width: 1600, crop: limit (never upscales, only shrinks if larger)
3. Note your Cloud Name from the dashboard (e.g. "dxyz1234")
4. Add to client/.env:
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=expenseflow_receipts

REMOVE these (no longer needed):
- browser-image-compression package → npm uninstall browser-image-compression
- firebase/storage import from firebase.js
- getStorage, uploadBytesResumable, getDownloadURL imports everywhere
- storage.rules file (Cloudinary handles its own access rules)

CREATE: client/src/hooks/useReceiptUpload.js

Replace the entire existing file with this:

import { useState } from 'react';

export function useReceiptUpload() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const upload = async (file) => {
    // Validate file type before upload
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED.includes(file.type)) {
      throw new Error('Only JPEG, PNG, or WebP images are accepted.');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File must be under 5 MB.');
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'receipts');

      // Cloudinary compresses + converts to WebP automatically on their servers
      // No browser-side compression needed
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      // Use XMLHttpRequest for real upload progress tracking
      const url = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            // Use secure_url — always HTTPS
            resolve(data.secure_url);
          } else {
            reject(new Error('Upload failed. Please try again.'));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload.'));
        });

        xhr.open('POST', endpoint);
        xhr.send(formData);
      });

      return url; // This is what gets saved to Firestore

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { upload, progress, uploading, error };
}

USAGE in ReceiptUpload.jsx (or ExpenseForm.jsx):
Replace the old upload call with:

  const { upload, progress, uploading, error } = useReceiptUpload();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const cloudinaryUrl = await upload(file);
      // Save this URL string to the Firestore expense document
      setReceiptUrl(cloudinaryUrl);
    } catch (err) {
      console.error(err.message);
    }
  };

FIRESTORE EXPENSE DOCUMENT — update the schema:
The receiptPath field (which previously stored a Firebase Storage path) is now
renamed to receiptUrl and stores the full Cloudinary HTTPS URL string directly.

Before: { receiptPath: "receipts/groupId/memberId/abc123.webp" }
After:  { receiptUrl: "https://res.cloudinary.com/your_cloud/image/upload/receipts/abc123.webp" }

Update everywhere receiptPath is read in the UI to use receiptUrl instead.
The URL is permanent and never expires — no need to call getDownloadURL() anymore.

DISPLAYING RECEIPTS:
Simply use the stored URL directly in an <img> tag:
  <img src={expense.receiptUrl} alt="Receipt" loading="lazy" />

Cloudinary URLs support on-the-fly transformations via URL parameters if needed:
  // Thumbnail version for expense list view (200px wide):
  const thumb = receiptUrl.replace('/upload/', '/upload/w_200,f_auto,q_auto/');

SECURITY NOTE:
Unsigned upload presets mean anyone with your Cloud Name + preset name can upload
to your Cloudinary account. This is standard practice for client-side apps.
Mitigations already in place:
  - Allowed formats restricted to jpg/png/webp (no SVG, no HTML)
  - Max file size set to 5 MB in the preset
  - Folder restricted to receipts/ in the preset
  - If abuse occurs: disable the preset in Cloudinary dashboard instantly

For extra protection (optional, requires a Netlify Function):
  Instead of unsigned uploads, create a sign-upload Netlify Function that
  generates a signed upload signature using your Cloudinary API secret,
  then have the client POST to Cloudinary using that signature.
  This prevents anyone outside your app from using the preset.
  Only implement this if you see abuse — it adds complexity.

CHECKLIST after implementing:
  [ ] npm uninstall browser-image-compression in client/
  [ ] Remove firebase/storage from firebase.js
  [ ] Delete storage.rules file
  [ ] VITE_CLOUDINARY_CLOUD_NAME added to Netlify environment variables
  [ ] VITE_CLOUDINARY_UPLOAD_PRESET added to Netlify environment variables
  [ ] Test upload: pick a 4 MB JPEG → verify Cloudinary serves it as WebP
  [ ] Test upload: pick an SVG → verify it is rejected
  [ ] Verify receiptUrl appears in Firestore expense document after upload
  [ ] Verify <img src={receiptUrl}> renders the receipt in ExpenseForm

---

### PROMPT 3 — Clerk Hybrid Authentication

```
Implement a hybrid authentication system for ExpenseFlow using Clerk.

AUTH MODEL:
- Mode A (Authenticated): User signs in with Clerk. Clerk issues a custom Firebase JWT. The Firebase Client SDK uses this JWT to satisfy Firestore Security Rules. The user can access any group they are a member of.
- Mode B (Guest access): User provides a 6-character group code AND a mandatory PIN. The app calls the jwt-bridge Netlify Function which verifies the code+PIN against Firestore, then issues a scoped Firebase custom token that grants access ONLY to that specific group document.

MODE B SECURITY REQUIREMENTS (critical):
- PIN is mandatory — there is NO code-only access path
- The PIN is SHA-256 hashed before storage (already done in groups.js — carry this over)
- The code+PIN lookup is rate-limited to 10 attempts per 15 minutes per IP at the Netlify Function level (use a simple in-memory store or Upstash Redis)
- On 3 failed PIN attempts in a row, the IP is blocked for 1 hour
- The Firebase custom token issued for guest access has expiry of 1 hour and contains a custom claim: { guestGroupId: "groupId", mode: "guest" }
- Firestore Security Rules check this claim so guest tokens cannot access other groups

CLERK SETUP:
- Install @clerk/clerk-react in client
- Wrap App.jsx in <ClerkProvider publishableKey={...}>
- Create a <SignInModal> that uses Clerk's <SignIn /> component with modal appearance
- After sign-in, call jwt-bridge function to exchange the Clerk session token for a Firebase token, then call firebase.auth().signInWithCustomToken()
- Store the auth mode (clerk | guest) in React Context so the UI can show different options to each

UI FLOWS to implement:
1. Landing page has two CTAs: "Sign in with Clerk" and "Join with a code"
2. "Join with a code" opens a modal with: group code input (6 chars) + PIN input (masked) + "Join group" button
3. After any auth, redirect to /dashboard
4. The group setup page is only available to Clerk-authenticated users (guests can view but not create groups)
5. Settings page shows auth mode badge: "Signed in" (green) or "Guest access" (grey) with option to upgrade to full Clerk account

Create a useAuth() custom hook that returns: { user, authMode, groupAccess, signOut, isLoaded }
```

---

### PROMPT 4 — Mobile-First Redesign with Liquid Glass

```
Redesign the ExpenseFlow UI with a mobile-first, minimal liquid glass aesthetic.

CONSTRAINTS (non-negotiable):
- Do NOT change the Aurora Forest color palette. Exact tokens from index.css must be preserved:
  --primary: #105D5E
  --primary-hover: #0D4A4B
  --success: #009A6E
  --highlight: #B3EDA9
  --accent: #E8E300
  --foreground: #293E33
  --text-muted: #767F7D
  --border: #C2CBC9
  --background: #EBFADB
  --surface: #FFFFFF
- Do NOT use red for negative balances. Use --text-muted (#767F7D) as designed.
- Install and use: npx stitch (Stitch MCP design tokens CLI)
- Install and use: npx motion-ai (Motion AI animation generator)

LIQUID GLASS RULES (mobile performance):
- Apply backdrop-filter: blur() ONLY to: bottom navigation bar, sticky top header, modal overlays
- NEVER apply blur to full-page backgrounds or large card grids — this kills frame rate on budget Android
- All glass components must include a performance fallback:
  @media (prefers-reduced-transparency: reduce) {
    .glass { backdrop-filter: none; background-color: rgba(255,255,255,0.95); }
  }
- Use will-change: transform on animated glass elements only, not statically rendered ones
- Glass tint color: rgba(235, 250, 219, 0.72) — derived from --background (#EBFADB) at 72% opacity
- Glass border: 1px solid rgba(194, 203, 201, 0.4) — derived from --border at 40% opacity

MOBILE LAYOUT TARGETS (design to 390px first, then 768px):
- Bottom navigation bar (glass): Home · Add · Groups · Reports — 4 tabs, icon + label
- Sticky top header (glass): ExpenseFlow wordmark left, avatar/auth badge right
- Cards: full-width on mobile, 2-column grid on tablet
- FAB (Floating Action Button): bottom-right, --primary color, opens AddExpense sheet
- Expense list: swipe-left to delete, swipe-right to edit (use Framer Motion drag)
- Dashboard charts: horizontal scroll on mobile, full-width on tablet

MOTION-AI ANIMATIONS (generated with npx motion-ai):
- Page transitions: slide-up enter, fade-out exit (150ms, ease-out)
- Card hover: subtle lift (translateY -2px, shadow increase) — desktop only, not mobile
- FAB: spring scale on press (0.92 → 1.0, stiffness: 400, damping: 20)
- Balance number: count-up animation on first load (duration 800ms)
- Fairness score gauge: draw arc animation (duration 600ms, ease-out)
- Sheet/drawer: slide-up from bottom (350ms, spring physics)

STITCH MCP TOKENS to generate:
- Run: npx stitch generate --from tailwind.config.js --output src/tokens/
- This generates design tokens from the existing Tailwind config
- Import tokens in index.css as CSS custom properties
- Use stitch tokens for all spacing, radius, and animation timing — do not hardcode

COMPONENT REDESIGN PRIORITY ORDER:
1. AppLayout.jsx — glass nav bar + header
2. Dashboard.jsx — mobile-optimized card grid + swipeable chart tabs
3. ExpenseLogger.jsx — bottom sheet instead of page transition
4. Landing.jsx — hero section with subtle glass card
5. GroupSetup.jsx — wizard step cards (mobile-friendly steps)
6. SettlementHistory.jsx — timeline list view

Do not redesign component logic — only visual layer (JSX structure, className, CSS).
```

---

### PROMPT 5 — SEO & Meta Tags Implementation

```
Implement full SEO for ExpenseFlow (https://expenseflow.site).

FILES TO CREATE OR MODIFY:
1. client/index.html — add all meta tags listed below
2. client/src/utils/seo.js — create a useSEO(config) custom hook using react-helmet-async
3. Add <HelmetProvider> to client/src/App.jsx
4. Create /public/sitemap.xml
5. Create /public/robots.txt
6. Create /public/manifest.json (PWA)

META TAGS for index.html (base tags):
```html
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>ExpenseFlow — Fair Expense Sharing for Roommates & Couples</title>
<meta name="description" content="Track shared expenses, split bills fairly, and settle up instantly. ExpenseFlow gives your group a fairness score so everyone stays happy." />
<meta name="keywords" content="expense tracker, split bills, shared expenses, roommate money, couple finance, fair split, expense sharing app" />
<meta name="author" content="Dhyandev P" />
<meta name="theme-color" content="#105D5E" />

<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://expenseflow.site/" />
<meta property="og:title" content="ExpenseFlow — Fair Expense Sharing" />
<meta property="og:description" content="Split bills, track expenses, and get a fairness score. No registration needed." />
<meta property="og:image" content="https://expenseflow.site/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name" content="ExpenseFlow" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:url" content="https://expenseflow.site/" />
<meta name="twitter:title" content="ExpenseFlow — Fair Expense Sharing" />
<meta name="twitter:description" content="Split bills, track expenses, and get a fairness score. No registration needed." />
<meta name="twitter:image" content="https://expenseflow.site/og-image.png" />

<!-- Canonical -->
<link rel="canonical" href="https://expenseflow.site/" />

<!-- Structured Data (JSON-LD) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "ExpenseFlow",
  "url": "https://expenseflow.site",
  "description": "Fair expense sharing for roommates, couples, and groups",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
  "author": { "@type": "Person", "name": "Dhyandev P", "url": "https://linktr.ee/DhyandevRTX" }
}
</script>
```

PER-PAGE SEO HOOK USAGE (implement in each page component):
```javascript
// Example: Dashboard.jsx
useSEO({
  title: 'Dashboard — ExpenseFlow',
  description: 'View your group balances, fairness scores, and expense breakdown.',
  canonical: 'https://expenseflow.site/dashboard'
})
```

SITEMAP (/public/sitemap.xml):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://expenseflow.site/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://expenseflow.site/join</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://expenseflow.site/setup</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://expenseflow.site/terms</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>https://expenseflow.site/privacy</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
</urlset>
```

ROBOTS.TXT (/public/robots.txt):
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /group/
Sitemap: https://expenseflow.site/sitemap.xml
```

PWA MANIFEST (/public/manifest.json):
```json
{
  "name": "ExpenseFlow",
  "short_name": "ExpenseFlow",
  "description": "Fair expense sharing for roommates and couples",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#EBFADB",
  "theme_color": "#105D5E",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```
```

---
PROMPT 9 — Balance Trigger Netlify Function

Create a Netlify Function that automatically updates the currentBalances
map on the group document every time an expense is written to Firestore.
This function is the most critical piece for keeping Firestore read costs
low. Without it every dashboard load would need to read every expense
document in the group to calculate balances. With it the dashboard only
ever needs to read one document.

The function should trigger whenever a new expense document is created or
updated inside any group expenses subcollection. It should read all
existing expenses for that group, run the same greedy debt simplification
algorithm and fairness score calculation that currently lives in the
Express backend, and write the results back to the group document as a
currentBalances map. The map should contain one entry per member with
their current net balance amount. It should also write a
settlementSuggestions array and a fairnessScores map to the same group
document in the same single write operation so the dashboard can read
everything it needs from one document.

The function should use the Firebase Admin SDK initialized with the
service account credentials stored as a base64 encoded environment
variable as described in Prompt 6. It should handle errors gracefully
and log them without crashing so that a single bad expense document does
not break balance calculations for the entire group. The financial math
logic should be imported from a shared utilities file so it stays
consistent with the client-side calculations and can be covered by the
Vitest tests from Prompt 7.
PROMPT 10 — Firestore Security Rules

Write the complete firestore.rules file for ExpenseFlow. The rules must
enforce all authorization at the database level without relying on any
middleware. Every rule must be as strict as possible — default deny
everything and explicitly allow only what is needed.

The rules must cover the following access patterns exactly.

A user can read a group document if they are a Clerk authenticated user
whose userId appears in that group's members subcollection, or if they
hold a valid guest custom token whose guestGroupId claim matches that
specific group's ID. No other users can read any group document.

A user can create a new group document only if they are Clerk
authenticated. Guests cannot create groups.

A user can read and write expense documents inside a group only if they
pass the same group membership check described above. They cannot read
or write expenses in any group they are not a member of.

The currentBalances map, settlementSuggestions array, and fairnessScores
map fields on the group document can only be written by the balance
trigger Netlify Function using the service account credentials. Regular
authenticated users and guest users can read these fields but cannot
write to them directly. Enforce this by checking for a specific custom
claim that only the service account token carries.

A user can read and write their own member document. They cannot write
to another member's document. They can read all member documents within
a group they belong to.

Settlement documents can be created by any group member. They cannot be
edited or deleted after creation.

Category documents can be read by any group member. They can only be
written by Clerk authenticated members, not guests.

All rules must include helper functions to avoid repetition. Write one
helper that checks Clerk authenticated group membership, one that checks
guest token group access, and one that combines both into a single
isGroupMember check used across all the rules. Include inline comments
explaining the reasoning behind each rule so the rules file serves as
documentation as well.

After writing the rules file also write the complete set of Firebase
Emulator test cases that verify every rule works correctly, covering
both the allowed and denied cases for each collection.
PROMPT 11 — SQLite to Firestore One-Time Migration Script

Write a one-time migration script that exports all existing data from
the SQLite database and seeds it into Firestore. This script runs once
locally before the Firebase migration goes live and never runs again.

The script should connect to the existing balanceboard.db SQLite file
using better-sqlite3, read every table in the correct order to respect
foreign key relationships, transform each row into the Firestore document
structure defined in Prompt 2, and write everything to Firestore using
the Firebase Admin SDK in batched writes of 500 documents at a time
which is the Firestore maximum per batch.

The migration order must be groups first, then members, then categories,
then expenses, then expense splits merged into their parent expense
documents, then settlements, then fairness snapshots, then recurring
templates. The IDs generated for Firestore documents should preserve the
original SQLite integer IDs converted to strings so that any existing
bookmarked group codes continue to work after migration.

After all documents are written the script should run the balance
calculation for every group and write the currentBalances, 
settlementSuggestions, and fairnessScores to each group document so
the dashboard works immediately after migration without waiting for the
trigger function to fire.

The script should log progress as it runs showing how many documents
were written for each collection. It should also do a verification pass
at the end that reads back a sample of documents from Firestore and
compares them to the SQLite source to confirm the data arrived correctly.
If any verification check fails the script should log exactly which
document failed and what the discrepancy was so it can be fixed before
going live.

The script should be placed in a scripts directory at the project root
and should never be deployed to Netlify. Add it to netlifyignore to
make that explicit.
PROMPT 12 — 404 Page

Create a 404 not found page for ExpenseFlow. The page should be placed
at the correct path for Netlify to serve it automatically when any route
does not match, which means it must also be registered in the React
Router configuration as the catch-all route.

The page must use the Aurora Forest color palette without any changes.
It should feel consistent with the rest of the app in typography,
spacing, and component style. It should clearly communicate to the user
that the page they are looking for does not exist. It should offer two
actions: go back to the home page, and if the user arrived here because
they were trying to join a group, go to the join group page directly.

The page should have a proper HTML title tag reading 404 — Page Not
Found and must return an actual 404 HTTP status code. Verify this is
configured correctly in netlify.toml because a React SPA served by
Netlify will return 200 for all routes by default unless explicitly
configured otherwise. The SEO meta tags for this page should include a
noindex directive so search engines do not index it.
PROMPT 13 — og:image

Design and generate the open graph image for ExpenseFlow. This image
appears when the site is shared on WhatsApp, Twitter, LinkedIn, and
any other platform that reads og:image meta tags. It must be exactly
1200 pixels wide and 630 pixels tall and saved as a PNG file placed
in the client public directory.

The background color must be the Aurora Forest background token which
is hex #EBFADB. The ExpenseFlow wordmark must appear prominently using
the foreground color hex #293E33. The tagline beneath it should read
Fair expense sharing for roommates and couples in the muted text color
hex #767F7D. Include a visual element that suggests the fairness score
concept, such as a simple gauge or balance indicator, using the primary
color hex #105D5E as the main accent. Do not use red anywhere on the
image. Do not use any color outside the Aurora Forest palette.

The overall composition should be clean and minimal with generous
whitespace. It should be immediately legible as a small thumbnail
because most platforms display the og:image at reduced size in feeds.
Text must be large enough to read at 600 pixels wide which is roughly
half the full size.

After generating the image verify it renders correctly by pasting the
expenseflow.site URL into https://opengraph.xyz and confirming the
image appears as expected in the preview.
### PROMPT 6 — Git History Cleanup

```
CRITICAL SECURITY — clean exposed credentials from git history.

The file server/.env was committed to git with live Clerk API keys:
- CLERK_SECRET_KEY=sk_live_... (MUST be rotated immediately in Clerk dashboard)
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...

STEPS TO EXECUTE IN ORDER:
1. FIRST: Go to https://dashboard.clerk.com → API Keys → Rotate the live secret key NOW before anything else
2. Add server/.env to .gitignore if not already there
3. If the repository has fewer than 20 commits and is not yet public, the safest fix is:
   cd /path/to/project
   rm -rf .git
   git init
   git add .
   git commit -m "initial commit — fresh history, credentials rotated"
4. If the repository has significant history to preserve, use git-filter-repo:
   pip install git-filter-repo
   git filter-repo --path server/.env --invert-paths --force
   git remote add origin [your-remote-url]
   git push origin --force --all
5. After cleanup, verify no .env appears in history:
   git log --all --full-history -- server/.env
   (should return empty)
6. Add a pre-commit hook to prevent future accidents:
   echo '#!/bin/sh
   if git diff --cached --name-only | grep -qE "\.env$"; then
     echo "ERROR: .env file detected in commit. Aborting."
     exit 1
   fi' > .git/hooks/pre-commit
   chmod +x .git/hooks/pre-commit

FIREBASE SERVICE ACCOUNT — base64 encoding:
When you download the Firebase service account JSON for Netlify Functions:
  base64 service-account.json | tr -d '\n'
Store this base64 string as FIREBASE_SERVICE_ACCOUNT_B64 in Netlify environment variables.
Decode it in your Netlify function:
  const sa = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8'))
  admin.initializeApp({ credential: admin.credential.cert(sa) })
```

---

### PROMPT 7 — Vitest Unit Tests for Math Logic

```
Add unit tests for all financial math in ExpenseFlow using Vitest.

Install: npm install -D vitest @vitest/ui in the client directory.
Add to package.json scripts: "test": "vitest", "test:ui": "vitest --ui"

Create file: client/src/utils/__tests__/balanceMath.test.js

TEST CASES TO IMPLEMENT:

1. greedySettle() — debt simplification algorithm
   - 3 members: Alice paid 3000, Bob paid 0, Charlie paid 0 → Bob owes Alice 1000, Charlie owes Alice 1000
   - 4 members with unequal splits → minimum number of transactions (≤ N-1)
   - All settled → empty suggestions array
   - Single member → no suggestions

2. fairnessScore() — score calculation
   - Equal contributions → score 100 for all members
   - One member paid everything → score 100 for payer, 0 for others
   - Score is always in range [0, 100]
   - Score rounds to integer

3. applyRecurring() — date advancement
   - Weekly template: last_run = 7+ days ago → should trigger
   - Monthly template: last_run < 30 days → should NOT trigger
   - Apply advances next_run correctly

4. csvSafe() — formula injection protection
   - Value starting with "=" → prefixed with "'"
   - Value starting with "+" → prefixed with "'"
   - Normal string → unchanged
   - Number → unchanged

5. calculateSplits() — split model logic
   - Equal split: 3000 / 3 members → 1000 each
   - Custom percentage: [60, 30, 10] of 1000 → [600, 300, 100]
   - Rounding: sum of splits must always equal total (handle floating point)

Run all tests: npx vitest run
Watch mode: npx vitest
```

---

## PART 2 — LEGAL PAGES

### Terms and Conditions

**Route:** `/terms`  
**Last updated:** August 2026

---

**EXPENSEFLOW TERMS AND CONDITIONS**

Welcome to ExpenseFlow ("the Service"), operated by Dhyandev P ("we", "us", "our"), accessible at https://expenseflow.site.

By accessing or using ExpenseFlow, you agree to these Terms. If you do not agree, do not use the Service.

**1. Description of Service**

ExpenseFlow is a shared expense tracking and fairness scoring tool for groups, roommates, and couples. The Service allows users to log shared expenses, compute net balances, and generate settlement suggestions.

**2. Eligibility**

You must be at least 13 years of age to use ExpenseFlow. By using the Service, you represent that you meet this requirement.

**3. User Accounts and Group Access**

The Service offers two access modes:
- Authenticated access via Clerk (email/social login)
- Guest access using a 6-character group code and mandatory PIN

You are responsible for keeping your group code and PIN confidential. We are not liable for unauthorized access caused by sharing your credentials.

**4. User Content**

You retain ownership of all data you input into ExpenseFlow (expense descriptions, amounts, receipts). By uploading content, you grant us a limited license to store and process it solely to provide the Service. We do not sell your data to third parties.

**5. Prohibited Uses**

You may not use ExpenseFlow to:
- Submit false or fraudulent financial data
- Attempt to access other users' groups without authorization
- Conduct automated attacks, scraping, or brute-force code guessing
- Use the Service for illegal money transfers or fraud

**6. Receipt Uploads**

Receipt images are stored in Firebase Storage. You may only upload images of genuine receipts you are authorized to share with your group. Images must be in JPEG, PNG, or WebP format and under 5 MB.

**7. Data Retention**

Group data is retained as long as the group is active. We reserve the right to delete groups that have had no activity for 12 consecutive months, with 30 days' notice sent to group members who have registered accounts.

**8. Disclaimer of Warranties**

ExpenseFlow is provided "as is" without warranties of any kind. We do not guarantee the accuracy of balance calculations for tax, legal, or financial compliance purposes. The fairness score is an informational metric only.

**9. Limitation of Liability**

To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, or consequential damages arising from your use of ExpenseFlow, including financial disputes between group members.

**10. Changes to Terms**

We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance. Material changes will be announced on the website.

**11. Governing Law**

These Terms are governed by the laws of India. Any disputes shall be resolved in the courts of Kerala, India.

**12. Contact**

For questions about these Terms, contact us at: dhyandevp@proton.me  
Developer: https://linktr.ee/DhyandevRTX

---

### Privacy Policy

**Route:** `/privacy`  
**Last updated:** August 2026

---

**EXPENSEFLOW PRIVACY POLICY**

This Privacy Policy describes how ExpenseFlow (https://expenseflow.site) collects, uses, and protects your information.

**1. Information We Collect**

*Information you provide:*
- Group names and member names
- Expense amounts, descriptions, and categories
- Receipt images you upload
- Email address (if you register via Clerk)

*Information collected automatically:*
- IP address (for rate limiting and abuse prevention, not stored long-term)
- Basic usage analytics (page views, feature usage — anonymized)
- Browser type and device type

**2. How We Use Your Information**

- To provide and operate the expense tracking service
- To calculate balances and fairness scores
- To generate reports you request
- To prevent abuse and unauthorized access
- We do NOT use your financial data for advertising

**3. Data Storage**

All data is stored in Google Firebase (Firestore and Storage), subject to Google's data processing terms. Servers are located in the United States (Firebase default region). If you are based in India or the EU, by using the Service you consent to this data transfer.

**4. Data Sharing**

We do not sell, rent, or share your personal data with third parties, except:
- With Firebase/Google as our infrastructure provider
- With Clerk as our authentication provider
- When required by law

**5. Receipt Images**

Receipt images are stored in Firebase Storage and are accessible only to members of the group they were uploaded to, enforced by Firebase Storage Security Rules.

**6. Cookies and Local Storage**

ExpenseFlow uses:
- Clerk authentication cookies (session management)
- IndexedDB (offline data cache for PWA functionality)
- No advertising or tracking cookies

**7. Your Rights**

You may:
- Delete your expenses and group data at any time through the app
- Request complete account deletion by emailing dhyandevp@proton.me
- Export your group's data as CSV from the Reports section

**8. Children's Privacy**

ExpenseFlow is not directed at children under 13. We do not knowingly collect data from children under 13.

**9. Security**

We implement industry-standard security measures including:
- Firestore Security Rules enforcing per-user data access
- Mandatory PIN for guest group access
- Rate limiting on all code lookup endpoints
- HTTPS enforced across all connections

**10. Changes to This Policy**

We may update this Privacy Policy from time to time. We will notify registered users of significant changes via email.

**11. Contact**

For privacy requests or questions: dhyandevp@proton.me  
Developer: https://linktr.ee/DhyandevRTX

---

### Contact Page

**Route:** `/contact`

---

**CONTACT EXPENSEFLOW**

Have a question, found a bug, or want to suggest a feature?

**Email:** dhyandevp@proton.me  
**Response time:** Within 48 hours on weekdays

**Developer:** Dhyandev P  
**Links:** https://linktr.ee/DhyandevRTX

For urgent security issues (vulnerability reports), please email with the subject line: `[SECURITY] ExpenseFlow`

We appreciate responsible disclosure and will respond to security reports within 24 hours.

---

## PART 3 — SEO STRATEGY

### Target Keywords

| Priority | Keyword | Monthly Intent | Page Target |
|---|---|---|---|
| High | expense tracker for roommates | Transactional | Landing |
| High | split bills app India | Transactional | Landing |
| High | shared expense app couples | Transactional | Landing |
| Medium | how to track shared expenses | Informational | Landing/Blog |
| Medium | bill splitting fairness | Informational | Landing |
| Low | Splitwise alternative India | Comparative | Landing |
| Low | expense sharing app free | Transactional | Landing |

### Page-by-Page SEO

**Landing Page (`/`)**
- H1: "Fair expense sharing for roommates, couples & groups"
- H2: "Know exactly who owes what, every time"
- H2: "Your group's fairness score at a glance"
- Description: 160 chars max, include "no registration needed"
- CTA above the fold: "Start tracking free" (no sign-up required)

**og:image specifications**
- Size: 1200×630 px
- Background: --background (#EBFADB)
- Wordmark: "ExpenseFlow" in --foreground (#293E33), large
- Tagline: "Fair expense sharing" in --text-muted
- Decorative: subtle gauge showing fairness score graphic

### Performance SEO (Core Web Vitals targets)
- LCP (Largest Contentful Paint): < 2.5s — use Netlify CDN + image preload hints
- CLS (Cumulative Layout Shift): < 0.1 — set explicit width/height on all images
- FID / INP: < 100ms — code-split all routes (already done in App.jsx)
- Run Lighthouse audit after each major deploy

### Technical SEO Checklist
- [ ] All pages have unique `<title>` tags
- [ ] All pages have unique meta descriptions (120–160 chars)
- [ ] Canonical tags on all pages
- [ ] Sitemap submitted to Google Search Console
- [ ] robots.txt verified not blocking important paths
- [ ] Structured data (JSON-LD) validated at schema.org
- [ ] 404 page exists and returns actual 404 status (check netlify.toml)
- [ ] No broken internal links
- [ ] HTTPS only (enforced by Netlify)
- [ ] Mobile-friendly test passed (Google)

---

## PART 4 — SECURITY TESTING CHECKLIST

### Pre-launch Security Testing

**A. Authentication & Access Control**
- [ ] Test Mode B (guest): try code without PIN → should reject with 401
- [ ] Test Mode B: try 11 code+PIN attempts → should block IP after 10
- [ ] Test Mode B: try a valid code with wrong PIN 3 times → should block for 1 hour
- [ ] Test guest token: try to access a different group's Firestore path → should reject with Firestore permission-denied
- [ ] Test Clerk JWT: expire the token, try a Firestore write → should reject
- [ ] Test group creation: try as guest → should reject (only authenticated users)
- [ ] Try accessing `/api/*` Netlify functions without auth headers → should return 401

**B. Firestore Security Rules Testing**
Run using Firebase Emulator Suite (`firebase emulators:start --only firestore`):
```javascript
// Test 1: Unauthenticated user cannot read any group
await assertFails(db.collection('groups').doc('someGroupId').get())

// Test 2: Authenticated user can read their own group
await assertSucceeds(authedDb.collection('groups').doc(myGroupId).get())

// Test 3: Authenticated user cannot read another group
await assertFails(authedDb.collection('groups').doc(otherGroupId).get())

// Test 4: Guest token can only read its specific group
await assertSucceeds(guestDb.collection('groups').doc(guestGroupId).get())
await assertFails(guestDb.collection('groups').doc(otherGroupId).get())

// Test 5: currentBalances can only be written by service function
await assertFails(authedDb.collection('groups').doc(myGroupId).update({ currentBalances: {} }))
```

**C. Input Validation**
- [ ] Submit an expense with amount = -1 → should reject
- [ ] Submit an expense with amount = 999999999 → should reject (set max: 10,000,000)
- [ ] Submit a description with SQL injection string: `'; DROP TABLE groups; --` → should store as plain text
- [ ] Submit a CSV export with a description starting with `=SUM(` → should be sanitized with leading `'`
- [ ] Upload a file that is not JPEG/PNG/WebP → should reject with 400
- [ ] Upload a file larger than 5 MB → should reject with 413

**D. Rate Limiting**
- [ ] Send 11 requests to the code lookup endpoint within 15 minutes → 11th should return 429
- [ ] Send 11 requests from different IPs (simulate botnet) → verify Firestore counter TTL blocks across IPs
- [ ] Verify rate limit headers are present: `X-RateLimit-Remaining`, `Retry-After`

**E. Environment & Secrets**
- [ ] Confirm `server/.env` is in `.gitignore` and NOT tracked by git
- [ ] Confirm `git log --all -- server/.env` returns empty after history cleanup
- [ ] Confirm Clerk keys have been rotated in the Clerk dashboard
- [ ] Confirm FIREBASE_SERVICE_ACCOUNT_B64 is stored in Netlify env vars, not in any file
- [ ] Confirm `.env.example` exists with placeholder values and IS committed

**F. HTTPS & Headers**
- [ ] Verify HTTPS redirect active (Netlify enforces this)
- [ ] Check security headers with https://securityheaders.com:
  - Content-Security-Policy present
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy present
- [ ] Verify no sensitive data in browser Network tab responses (no internal IDs exposed unnecessarily)

**G. Receipt Image Security**
- [ ] Verify Firebase Storage Rules: only group members can read/write receipts for their group
- [ ] Test: try to access a receipt URL from a group you are not a member of → should return 403
- [ ] Verify uploaded files are served with Content-Disposition: attachment (not inline) to prevent XSS via SVG upload
- [ ] Confirm MIME type validation rejects SVG and HTML files even if renamed to .jpg

---

## PART 5 — MOBILE VERIFICATION FLOW

### Full Verification System Design

ExpenseFlow needs email verification for registered users and PIN verification for guests. Here is the complete flow.

**Verification Flow A — Clerk Email Verification**

Clerk handles this automatically. After a user signs up with email:
1. Clerk sends a verification email with a 6-digit OTP
2. User enters OTP in Clerk's built-in `<SignUp />` component
3. On success, Clerk marks `emailAddresses[0].verification.status = "verified"`
4. Your app checks `user.primaryEmailAddress?.verification.status === 'verified'` before allowing group creation

**Verification Flow B — Guest PIN Verification (custom)**

```
User enters:
  ┌──────────────────────────────────┐
  │  Group code:  [_ _ _ _ _ _]      │
  │  Group PIN:   [● ● ● ● ● ●]      │
  │                                  │
  │  [  Join group  ]                │
  └──────────────────────────────────┘

On submit:
  1. Client calls POST /netlify/functions/jwt-bridge
     body: { code: "XYZABC", pinHash: sha256(userEnteredPIN) }

  2. jwt-bridge function:
     a. Look up Firestore: groups where code == "XYZABC"
     b. Check rateLimit counter for this IP (reject if > 10 in 15min)
     c. Compare pinHash to stored group.pinHash (constant-time compare)
     d. On match: issue Firebase custom token with claim { guestGroupId: groupId, mode: "guest" }
     e. Return: { firebaseToken: "...", groupId: "...", expiresIn: 3600 }
     f. On fail: increment attempt counter. After 3 failures: set blockUntil = now + 1hr

  3. Client calls firebase.auth().signInWithCustomToken(firebaseToken)
  4. Firebase SDK is now authenticated with scoped guest access
  5. Redirect to /dashboard (group context set in React Context)
```

**Error States to handle in UI:**
- Wrong PIN: "Incorrect PIN. X attempts remaining before lockout."
- Code not found: "Group not found. Check the code and try again."
- Locked out: "Too many attempts. Please try again in 60 minutes."
- Network error: "Could not connect. Check your connection and retry." (with retry button)

**PIN Input Component Requirements:**
- 6-character masked input (dots, not asterisks — better mobile UX)
- Number pad optimized: `inputMode="numeric"` on mobile
- Auto-advance focus on 6th character entry
- Show/hide toggle (eye icon) for accessibility
- Shake animation on wrong PIN (Framer Motion: keyframes x: [0, -8, 8, -8, 8, 0])
- Clear on 3rd failure

**Antigravity Prompt for Verification Component:**
```
Create a PINVerification.jsx component for ExpenseFlow with the following spec:
- 6-digit masked PIN input using individual <input> elements (one per digit) for mobile number pad UX
- inputMode="numeric" on each input for mobile keyboard optimization
- Auto-focus next input on digit entry, auto-focus previous on backspace
- "Show PIN" toggle using an eye icon
- Shake animation using Framer Motion when PIN is incorrect
- Submit button disabled until all 6 digits are entered
- Props: { onSubmit(pin: string), isLoading: boolean, errorMessage: string, attemptsRemaining: number }
- Use Aurora Forest tokens: --primary for active input border, --border for inactive, --accent for error shake
- Mobile-first: full-width inputs on mobile, centered max-width 340px on desktop
- Accessible: aria-labels on each input, aria-live region for error messages
```

---

## PART 6 — ARCHITECTURE DECISION RECORD (ADR)

### ADR-001: Why No Firebase Admin SDK in Client

**Decision:** Use Firebase Client SDK with Clerk-issued custom JWTs instead of Admin SDK in an Express server.

**Consequences (positive):**
- Firestore Security Rules are the single source of authorization truth
- No Express server means no cold-start problem on Render free tier
- Guest tokens are automatically scoped — a guest cannot escalate to admin by changing a request header

**Consequences (negative):**
- Complex Firestore Security Rules require careful testing with the Emulator Suite
- Aggregation queries (dashboard balance calculation) need a trigger function instead of a SQL SUM()
- Cannot use Firestore transactions that span multiple collections as easily

**Mitigation for negative:** The `currentBalances` denormalized field on the group document solves the aggregation problem. One document read = full dashboard. The trigger function updates it after every expense write.

---

### ADR-002: Why Denormalize currentBalances

**Decision:** Store a `currentBalances: { memberId: amount }` map directly on the group document, maintained by a trigger Netlify Function.

**Rejected alternative:** Query all expenses on every dashboard load (N reads per load where N = expense count).

**Why rejected:** Firestore charges per document read. A group with 500 expenses = 500 reads every time a user opens the dashboard. At Firebase Spark plan limits, this burns through the free quota within days for an active group.

**Accepted tradeoff:** currentBalances may be slightly stale during the trigger function's execution window (~200ms). This is acceptable for an expense tracking app (not a real-time trading platform).

---

*End of ExpenseFlow Documentation Package*  
*Generated: August 2026 | Contact: dhyandevp@proton.me*
