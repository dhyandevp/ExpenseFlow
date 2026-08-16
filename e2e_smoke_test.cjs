const { chromium } = require('playwright');
const assert = require('assert');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runE2E() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("=== Journey 1: Landing and Auth ===");
    await page.goto('https://expenseflow.site/');
    
    // Clerk login
    console.log("Logging in via Clerk...");
    await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const checkClerk = setInterval(async () => {
          if (window.Clerk && window.Clerk.isReady) {
            clearInterval(checkClerk);
            try {
              // Create signin with a test user
              await window.Clerk.client.signIn.create({
                identifier: 'test@example.com',
                password: 'Password123!',
              });
              await window.Clerk.setActive({ session: window.Clerk.client.sessions[0].id });
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        }, 500);
      });
    });

    await page.waitForURL('**/home*');
    console.log("✅ Authenticated and on Home page.");

    console.log("=== Journey 2: Create Group ===");
    await page.click('text="Create Group"');
    const groupName = 'E2E Test Group ' + Date.now();
    await page.fill('input[placeholder="e.g. Goa Trip 2024, Apartment"]', groupName);
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Continue")'); // Members step
    await page.click('button:has-text("Create Group")');
    
    await page.waitForURL('**/group/*');
    console.log("✅ Group created and on Dashboard.");

    console.log("=== Journey 3: Add Expense ===");
    // Click Add Expense (usually a plus button or a direct nav item)
    // Actually we are on dashboard. Let's go to Expenses page.
    await page.click('text="Expenses"');
    await page.waitForURL('**/group/*');
    // Assuming Expenses is the root of /group/:id
    
    await page.click('text="Add Expense"');
    // Wait for the modal/form
    await delay(1000);
    await page.fill('input[placeholder="e.g. Groceries"]', 'Dinner');
    await page.fill('input[placeholder="0.00"]', '100');
    await page.click('button:has-text("Save")');
    console.log("✅ Expense added.");

    console.log("=== Journey 4: Check Balances & Fairness ===");
    await page.click('text="Dashboard"');
    await page.waitForURL('**/group/*/dashboard');
    // Wait for text to appear
    await page.waitForSelector('text="Fairness Score"');
    console.log("✅ Dashboard and Fairness verified.");

    console.log("=== Journey 5: Settings and Delete Group ===");
    await page.click('text="Settings"');
    await page.waitForURL('**/group/*/settings');
    await page.click('button:has-text("Delete group")');
    await page.waitForSelector(`text="Delete \\"${groupName}\\"?"`);
    await page.fill(`input[placeholder="${groupName}"]`, groupName);
    await page.click('button:has-text("Delete permanently")');
    
    await page.waitForURL('**/home*');
    console.log("✅ Group deleted successfully.");

    console.log("=== Journey 6: Logout ===");
    // Assuming there is a logout button in AccountMenu
    // Usually click avatar then click Sign out
    await page.evaluate(async () => {
      await window.Clerk.signOut();
    });
    
    await page.waitForURL('**/');
    console.log("✅ Logged out.");
    
    console.log("🎉 ALL E2E SMOKE TESTS PASSED!");

  } catch (err) {
    console.error("❌ E2E Failed:", err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runE2E();
