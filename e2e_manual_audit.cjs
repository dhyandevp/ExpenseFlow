const { chromium } = require('playwright');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Navigating to https://expenseflow.site");
  await page.goto('https://expenseflow.site');
  
  await page.click('text=Join with Code');
  await page.fill('input[placeholder="Enter 6-character code"]', 'TESTA');
  await page.fill('input[placeholder="Enter Group PIN"]', '1234');
  
  await page.waitForTimeout(5000); // Wait to observe dashboard
  
  await browser.close();
}
run();
