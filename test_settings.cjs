const { chromium } = require('playwright');

async function testLeaveAndDelete() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Navigating to https://expenseflow.site/...");
  await page.goto('https://expenseflow.site/');

  // We need to login.
  console.log("Logging in via Clerk...");
  await page.evaluate(async () => {
    return new Promise((resolve, reject) => {
      const checkClerk = setInterval(async () => {
        if (window.Clerk && window.Clerk.isReady) {
          clearInterval(checkClerk);
          try {
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
  console.log("Logged in and on Home page.");

  // Create a dedicated test group for deleting
  console.log("Creating a test group...");
  await page.click('text="Create Group"');
  await page.fill('input[placeholder="e.g. Goa Trip 2024, Apartment"]', 'Test Delete Group');
  await page.click('button:has-text("Continue")');
  await page.click('button:has-text("Continue")');
  await page.click('button:has-text("Create Group")');

  // Wait until we are inside the group dashboard
  await page.waitForURL('**/group/*');
  console.log("In the group dashboard.");

  // Go to Settings
  await page.click('text="Settings"');
  await page.waitForURL('**/settings');
  console.log("In Settings page.");

  // 1. Leave Group Flow
  console.log("Testing Leave Group flow...");
  await page.click('button:has-text("Leave group")');
  await page.waitForSelector('text="Leave this group?"');
  
  // Cancel leaving
  await page.click('button:has-text("Cancel")');
  
  // Try leaving again
  await page.click('button:has-text("Leave group")');
  await page.waitForSelector('text="Leave this group?"');
  await page.click('button:has-text("Leave group")');
  
  // Should redirect to Home
  await page.waitForURL('**/home*');
  console.log("Leave group test passed.");

  // 2. Delete Group Flow
  console.log("Creating another test group for deletion...");
  await page.click('text="Create Group"');
  await page.fill('input[placeholder="e.g. Goa Trip 2024, Apartment"]', 'Delete Me');
  await page.click('button:has-text("Continue")');
  await page.click('button:has-text("Continue")');
  await page.click('button:has-text("Create Group")');

  await page.waitForURL('**/group/*');
  console.log("In the group dashboard.");

  await page.click('text="Settings"');
  await page.waitForURL('**/settings');
  console.log("In Settings page.");

  console.log("Testing Delete Group flow...");
  await page.click('button:has-text("Delete group")');
  await page.waitForSelector('text="Delete \\"Delete Me\\"?"');
  
  // Cancel deletion
  await page.click('button:has-text("Cancel")');
  
  // Delete permanently
  await page.click('button:has-text("Delete group")');
  await page.waitForSelector('text="Delete \\"Delete Me\\"?"');
  
  // Try to click delete without typing - it should be disabled
  const isDeleteDisabled = await page.$eval('button:has-text("Delete permanently")', btn => btn.disabled);
  if (!isDeleteDisabled) {
    throw new Error("Delete button should be disabled until group name is typed");
  }
  
  // Type group name
  await page.fill('input[placeholder="Delete Me"]', 'Delete Me');
  await page.click('button:has-text("Delete permanently")');
  
  // Should redirect to Home
  await page.waitForURL('**/home*');
  console.log("Delete group test passed. Checking if group is absent...");
  
  const hasGroup = await page.evaluate(() => {
    return document.body.textContent.includes('Delete Me');
  });
  
  if (hasGroup) {
    throw new Error("Group 'Delete Me' is still present after deletion!");
  }
  
  console.log("All tests passed!");
  
  await browser.close();
}

testLeaveAndDelete().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
