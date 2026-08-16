const { test, expect } = require('@playwright/test');

test('Click Sign in', async ({ page }) => {
  await page.goto('https://expenseflow.site');
  
  const signinButton = page.locator('text=/Sign in|Log in/i').first();
  await signinButton.click();
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/after-signin-click.png', fullPage: true });
  console.log('Current URL after clicking signin:', page.url());
});
