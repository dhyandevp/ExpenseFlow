const { test, expect } = require('@playwright/test');

test('test landing', async ({ page }) => {
  await page.goto('https://expenseflow.site');
  await page.screenshot({ path: 'landing.png' });
  console.log("Screenshot taken.");
});
