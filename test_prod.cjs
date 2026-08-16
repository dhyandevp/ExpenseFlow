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

    // The modal or page for Group Code and PIN should appear
    await page.getByPlaceholder(/Group Code/i).fill('PWTEST');
    await page.getByPlaceholder(/PIN/i).fill('123456');

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
  } finally {
    if (errors.length > 0) {
      console.log("Browser Console Errors:", errors);
    }
    await browser.close();
  }
})();
