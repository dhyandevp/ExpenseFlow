const { chromium } = require('playwright');

async function run() {
  const code = "TESTA";
  const pin = "123456";
  const url = "https://expenseflow.site";

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle' });

  console.log('Clicking "Join with Code"...');
  await page.click('text=Join with Code');

  console.log('Filling GuestJoinModal...');
  await page.fill('input[placeholder="e.g. A1B2C3"]', code);
  
  const pinInputs = await page.$$('input[inputmode="numeric"]:not([placeholder="e.g. A1B2C3"])');
  await pinInputs[0].focus();
  await page.keyboard.type(pin, { delay: 100 });

  await page.screenshot({ path: 'pin_entered.png' });

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  console.log('PIN typed. Auto-submit should happen.');

  console.log('Waiting for dashboard to load...');
  try {
    await page.waitForURL(`**/group/${code}/dashboard`, { timeout: 15000 });
    console.log('Landed on dashboard!');
  } catch (err) {
    await page.screenshot({ path: 'navigation_timeout.png' });
    throw err;
  }

  console.log('Looking for "Expenses" tab...');
  await page.click('a:has-text("Expenses")');
  await page.waitForURL(`**/group/${code}`, { timeout: 10000 });
  console.log('Landed on Expenses tab!');
  
  console.log('Trying to add an expense...');
  try {
    // Wait for the button to be attached to the DOM first
    await page.waitForSelector('button:has-text("Add Expense")', { timeout: 10000 });
    // Click the first visible one (e.g. Empty State button or Header button)
    await page.locator('button:has-text("Add Expense") >> visible=true').first().click({ timeout: 5000 });
  } catch (err) {
    await page.screenshot({ path: 'add_expense_click_failed.png' });
    throw err;
  }
  // Wait for an input for Description or Amount
  await page.waitForSelector('input[placeholder="What was this for?"]', { timeout: 10000 });
  await page.fill('input[placeholder="What was this for?"]', 'E2E Test Lunch');
  
  await page.fill('input[placeholder="0.00"]', '150');
  await page.locator('label:has-text("Paid by")').locator('..').locator('select').selectOption({ index: 1 });
  
  // Submit the expense
  await page.click('form button[type="submit"]');
  
  console.log('Waiting for expense to appear in list...');
  await page.waitForSelector('text=E2E Test Lunch', { timeout: 10000 });
  console.log('Expense added successfully!');

  await browser.close();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
