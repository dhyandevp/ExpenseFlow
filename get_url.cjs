const { chromium } = require('playwright');
async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://expenseflow.site", { waitUntil: 'networkidle' });
  await page.click('text=Join with Code');
  await page.fill('input[placeholder="e.g. A1B2C3"]', "TESTA");
  const pinInputs = await page.$$('input[inputmode="numeric"]:not([placeholder="e.g. A1B2C3"])');
  await pinInputs[0].focus();
  await page.keyboard.type("123456", { delay: 100 });
  await page.waitForTimeout(5000); // Wait 5 seconds
  console.log("Current URL is:", page.url());
  await browser.close();
}
run();
