const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('ERR_FAILED')) {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => errors.push(err.message));

  try {
    // Wait for the site to load
    await page.goto('https://expenseflow.site');
    
    // Click "Join with Code"
    await page.getByRole('button', { name: /Join with Code/i }).first().click();

    await page.waitForTimeout(2000); // Wait for modal animation
    await page.screenshot({ path: 'test_modal.png' });

    // The modal or page for Group Code and PIN should appear
    await page.getByPlaceholder(/e.g. A1B2C3/i).fill('PWTEST');
    
    // Fill 6-digit PIN
    const pin = '123456';
    for (let i = 0; i < 6; i++) {
      await page.getByLabel(`Digit ${i + 1}`).fill(pin[i]);
    }

    // Click submit/join
    await page.getByRole('button', { name: /Join Group/i }).click();

    // Wait for navigation to /group/PWTEST
    await page.waitForURL('**/group/PWTEST', { timeout: 10000 });

    console.log("SUCCESS: Logged in as Guest on Production!");

    // Verify UI has members
    const membersText = await page.innerText('body');
    if (membersText.includes('Playwright') || membersText.includes('Playwright Test Group')) {
      console.log("SUCCESS: Fetched group data successfully!");
    } else {
      console.log("FAILED: Group data not visible.");
    }
  } catch(e) {
    console.log("ERROR:", e.message);
    await page.screenshot({ path: 'test_error.png' });
  } finally {
    if (errors.length > 0) {
      console.log("Browser Console Errors:", errors);
    }
    await browser.close();
  }
})();
