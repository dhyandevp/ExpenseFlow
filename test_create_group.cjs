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
    // We will run this against http://localhost:5173
    await page.goto('http://localhost:5173/group-setup', { waitUntil: 'load' });
    
    // Fill group name
    await page.getByPlaceholder(/Enter group name/i).fill('Test Playwright Group');
    
    // Add member
    await page.getByText(/Add Member/i).click();
    await page.locator('input[placeholder="Name"]').nth(2).fill('Charlie');
    
    // Continue
    await page.getByText(/Continue/i).click();
    
    // Continue again
    await page.getByText(/Continue/i).click();
    
    // Create group
    await page.getByText(/Create Group/i).click();
    
    await page.waitForTimeout(3000);
    
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
