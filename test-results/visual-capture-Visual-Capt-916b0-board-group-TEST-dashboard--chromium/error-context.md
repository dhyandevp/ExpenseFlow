# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual-capture.spec.cjs >> Visual Capture — Full App Screenshots >> mobile — dashboard (/group/TEST/dashboard)
- Location: tests/visual-capture.spec.cjs:32:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5174/
Call log:
  - navigating to "http://localhost:5174/", waiting until "domcontentloaded"

```

# Test source

```ts
  1  | // @ts-check
  2  | const { test, expect } = require("@playwright/test");
  3  | const path = require("path");
  4  | 
  5  | const VISUAL_DIR = path.resolve(__dirname, "..", "visual-audit");
  6  | 
  7  | // Mock group data to inject into localStorage for protected routes
  8  | const MOCK_GROUP = JSON.stringify({
  9  |   id: "test-group-123",
  10 |   code: "TEST",
  11 |   name: "Test Group",
  12 |   pinHash: "mock",
  13 |   createdAt: new Date().toISOString(),
  14 | });
  15 | 
  16 | const VIEWPORTS = [
  17 |   { name: "desktop", width: 1280, height: 720 },
  18 |   { name: "mobile", width: 390, height: 844 },
  19 | ];
  20 | 
  21 | const ROUTES = [
  22 |   { name: "landing", path: "/", needsGroup: false },
  23 |   { name: "join", path: "/join/TEST", needsGroup: false },
  24 |   { name: "expenses", path: "/group/TEST", needsGroup: true },
  25 |   { name: "dashboard", path: "/group/TEST/dashboard", needsGroup: true },
  26 |   { name: "settings", path: "/group/TEST/settings", needsGroup: true },
  27 | ];
  28 | 
  29 | test.describe("Visual Capture — Full App Screenshots", () => {
  30 |   for (const viewport of VIEWPORTS) {
  31 |     for (const route of ROUTES) {
  32 |       test(`${viewport.name} — ${route.name} (${route.path})`, async ({
  33 |         browser,
  34 |       }) => {
  35 |         const context = await browser.newContext({
  36 |           viewport: { width: viewport.width, height: viewport.height },
  37 |           deviceScaleFactor: viewport.name === "mobile" ? 2 : 1,
  38 |         });
  39 | 
  40 |         const page = await context.newPage();
  41 | 
  42 |         // Inject localStorage for protected routes before navigating
  43 |         if (route.needsGroup) {
  44 |           // Navigate to base first to set localStorage on correct origin
> 45 |           await page.goto("http://localhost:5174/", {
     |                      ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5174/
  46 |             waitUntil: "domcontentloaded",
  47 |           });
  48 |           await page.evaluate((groupData) => {
  49 |             localStorage.setItem("expenseflow_group", groupData);
  50 |             localStorage.setItem(
  51 |               "expenseflow_recent_groups",
  52 |               JSON.stringify([JSON.parse(groupData)])
  53 |             );
  54 |           }, MOCK_GROUP);
  55 |         }
  56 | 
  57 |         // Navigate to the target route
  58 |         // Use domcontentloaded instead of networkidle — Clerk SDK keeps
  59 |         // long-polling connections alive which prevents networkidle from firing
  60 |         await page.goto(`http://localhost:5174${route.path}`, {
  61 |           waitUntil: "domcontentloaded",
  62 |           timeout: 15000,
  63 |         });
  64 | 
  65 |         // Wait for React rendering + Framer Motion animations to settle
  66 |         await page.waitForTimeout(3000);
  67 | 
  68 |         // Take full-page screenshot
  69 |         const filename = `${viewport.name}-${route.name}.png`;
  70 |         await page.screenshot({
  71 |           path: path.join(VISUAL_DIR, filename),
  72 |           fullPage: true,
  73 |         });
  74 | 
  75 |         await context.close();
  76 |       });
  77 |     }
  78 |   }
  79 | });
  80 | 
```