const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://expenseflow.site', { waitUntil: 'networkidle' });
  
  console.log("Checking Landing Page...");
  const title = await page.title();
  console.log("Title:", title);
  
  console.log("Clicking Join with Code...");
  await page.click('button:has-text("Join with Code")');
  await page.waitForTimeout(1000);
  
  console.log("Filling invalid details...");
  await page.fill('input[placeholder="Enter 6-digit code"]', '123');
  await page.fill('input[placeholder="Enter 4-digit PIN"]', '12');
  await page.fill('input[placeholder="Your display name"]', 'Te');
  
  console.log("Checking button state...");
  const isDisabled = await page.isDisabled('button:has-text("Join Group")');
  console.log("Is Join button disabled with invalid input?", isDisabled);
  
  await browser.close();
}
run().catch(console.error);
