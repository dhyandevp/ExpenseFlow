// @ts-check
const { test, expect } = require("@playwright/test");
const path = require("path");

const VISUAL_DIR = path.resolve(__dirname, "..", "visual-audit");

// Mock group data to inject into localStorage for protected routes
const MOCK_GROUP = JSON.stringify({
  id: "test-group-123",
  code: "TEST",
  name: "Test Group",
  pinHash: "mock",
  createdAt: new Date().toISOString(),
});

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 720 },
  { name: "mobile", width: 390, height: 844 },
];

const ROUTES = [
  { name: "landing", path: "/", needsGroup: false },
  { name: "join", path: "/join/TEST", needsGroup: false },
  { name: "expenses", path: "/group/TEST", needsGroup: true },
  { name: "dashboard", path: "/group/TEST/dashboard", needsGroup: true },
  { name: "settings", path: "/group/TEST/settings", needsGroup: true },
];

test.describe("Visual Capture — Full App Screenshots", () => {
  for (const viewport of VIEWPORTS) {
    for (const route of ROUTES) {
      test(`${viewport.name} — ${route.name} (${route.path})`, async ({
        browser,
      }) => {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: viewport.name === "mobile" ? 2 : 1,
        });

        const page = await context.newPage();

        // Inject localStorage for protected routes before navigating
        if (route.needsGroup) {
          // Navigate to base first to set localStorage on correct origin
          await page.goto("http://localhost:5174/", {
            waitUntil: "domcontentloaded",
          });
          await page.evaluate((groupData) => {
            localStorage.setItem("expenseflow_group", groupData);
            localStorage.setItem(
              "expenseflow_recent_groups",
              JSON.stringify([JSON.parse(groupData)])
            );
          }, MOCK_GROUP);
        }

        // Navigate to the target route
        // Use domcontentloaded instead of networkidle — Clerk SDK keeps
        // long-polling connections alive which prevents networkidle from firing
        await page.goto(`http://localhost:5174${route.path}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });

        // Wait for React rendering + Framer Motion animations to settle
        await page.waitForTimeout(3000);

        // Take full-page screenshot
        const filename = `${viewport.name}-${route.name}.png`;
        await page.screenshot({
          path: path.join(VISUAL_DIR, filename),
          fullPage: true,
        });

        await context.close();
      });
    }
  }
});
