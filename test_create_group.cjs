const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  try {
    await page.goto('https://expenseflow.site/login', { waitUntil: 'load' });
    
    // Simulate login for testing - since it's production, we might need a test token or bypass.
    // Wait, it's easier to just read the code and find the undefined field.
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
